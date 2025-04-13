'use server'

import { prisma } from "@/lib/db"
import { CustomerOrder, CreateCustomerOrderInput } from "@/types/admin/customer-order"
import { Status, Priority } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library" 
import { revalidatePath } from "next/cache"
import { createProductionOrder } from "./production-order"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function getCustomerOrders(): Promise<CustomerOrder[]> {
  try {
    const orders = await prisma.customerOrder.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sellingPrice: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert Prisma model to CustomerOrder type with proper type conversion
    return orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      orderDate: order.orderDate,
      requiredDate: order.requiredDate,
      status: order.status,
      totalAmount: order.totalAmount instanceof Decimal ? order.totalAmount.toNumber() : Number(order.totalAmount),
      notes: order.notes,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
      },
      orderLines: order.orderLines.map(line => ({
        id: line.id,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice instanceof Decimal ? line.unitPrice.toNumber() : Number(line.unitPrice),
        status: line.status,
        product: line.product ? {
          id: line.product.id,
          name: line.product.name,
          sku: line.product.sku,
        } : undefined
      }))
    }));
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    throw new Error('Failed to fetch customer orders')
  }
}

/**
 * Checks inventory levels for ordered products and determines production needs
 * @param orderLines Array of order lines with product IDs and quantities
 * @returns Array of products needing production with required quantities
 */
export async function checkInventoryLevels(
  orderLines: Array<{ productId: string; quantity: number }>
) {
  // Get product IDs from order lines
  const productIds = orderLines.map(line => line.productId);
  
  // Fetch product details including inventory information
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds
      }
    },
    select: {
      id: true,
      sku: true,
      name: true,
      currentStock: true,
      minimumStockLevel: true,
      leadTime: true,
    }
  });

  // Convert any Decimal values to numbers to avoid serialization issues
  const normalizedProducts = products.map(product => ({
    ...product,
    // Ensure any potential Decimal fields are converted to numbers
    currentStock: typeof product.currentStock === 'object' && 'toNumber' in product.currentStock 
      ? (product.currentStock as any).toNumber() 
      : Number(product.currentStock),
    minimumStockLevel: typeof product.minimumStockLevel === 'object' && 'toNumber' in product.minimumStockLevel 
      ? (product.minimumStockLevel as any).toNumber() 
      : Number(product.minimumStockLevel),
    leadTime: typeof product.leadTime === 'object' && 'toNumber' in product.leadTime
      ? (product.leadTime as any).toNumber()
      : Number(product.leadTime)
  }));
  
  // Determine which products need production orders
  const productsNeedingProduction = [];
  
  for (const orderLine of orderLines) {
    const product = normalizedProducts.find(p => p.id === orderLine.productId);
    if (!product) continue;
    
    // Calculate required quantity based on:
    // 1. How much of the order exceeds current stock
    // 2. Whether fulfilling the order would drop below minimum stock level
    const stockAfterOrder = product.currentStock - orderLine.quantity;
    
    // Case 1: Not enough stock to fulfill the order
    if (stockAfterOrder < 0) {
      productsNeedingProduction.push({
        product,
        requiredQuantity: Math.abs(stockAfterOrder),
        reason: 'INSUFFICIENT_STOCK'
      });
      continue;
    }
    
    // Case 2: Enough stock for order but would drop below minimum level
    if (stockAfterOrder < product.minimumStockLevel) {
      productsNeedingProduction.push({
        product,
        // Order enough to restore minimum stock level
        requiredQuantity: product.minimumStockLevel - stockAfterOrder,
        reason: 'BELOW_MINIMUM'
      });
    }
  }
  
  return productsNeedingProduction;
}

export async function createCustomerOrder(data: CreateCustomerOrderInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const year = new Date().getFullYear()
    const lastOrder = await prisma.customerOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: `CO-${year}`
        }
      },
      orderBy: {
        orderNumber: 'desc'
      }
    })

    let sequenceNumber = 1
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2])
      sequenceNumber = lastSequence + 1
    }

    const orderNumber = `CO-${year}-${String(sequenceNumber).padStart(4, '0')}`

    const totalAmount = data.orderLines.reduce(
      (sum, line) => sum + (line.quantity * line.unitPrice),
      0
    )

    // Validate and convert `requiredDate`
    if (!data.requiredDate) {
      throw new Error('Required date is missing')
    }
    
    const requiredDate = new Date(data.requiredDate)
    if (isNaN(requiredDate.getTime())) {
      throw new Error('Invalid required date format')
    }

    // Use the checkInventoryLevels helper function to determine production needs
    const productsNeedingProduction = await checkInventoryLevels(data.orderLines);

    // Create the customer order
    const customerOrder = await prisma.customerOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        orderDate: new Date(), // Order date is always set to now
        requiredDate, // Now properly included
        status: Status.PENDING,
        totalAmount: new Decimal(totalAmount),
        notes: data.notes,
        orderLines: {
          create: data.orderLines.map(line => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: new Decimal(line.unitPrice),
            status: Status.PENDING
          }))
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sellingPrice: true,
              }
            }
          }
        }
      }
    })

    // Create production orders for products with insufficient inventory
    const createdProductionOrders = []
    
    // Get default work center for operations
    const defaultWorkCenter = await prisma.workCenter.findFirst({
      where: {
        status: Status.ACTIVE
      }
    })

    if (!defaultWorkCenter) {
      console.warn("No active work center found for production orders")
    }
    
    for (const item of productsNeedingProduction) {
      if (!defaultWorkCenter) continue // Skip if no default work center
      
      const startDate = new Date()
      const dueDate = new Date(requiredDate)
      dueDate.setDate(dueDate.getDate() - 1) // Set due date one day before required date
      
      try {
        const productionOrder = await createProductionOrder({
          productId: item.product.id,
          quantity: item.requiredQuantity,
          startDate,
          dueDate,
          priority: Priority.HIGH,
          customerOrderId: customerOrder.id,
          notes: `Auto-generated for Customer Order ${orderNumber} - Reason: ${item.reason}`,
          operations: [
            {
              workCenterId: defaultWorkCenter.id,
              startTime: startDate,
              endTime: dueDate,
              cost: 0 // Default cost, to be updated later
            }
          ]
        })
        
        createdProductionOrders.push(productionOrder)
      } catch (error) {
        console.error(`Failed to create production order for product ${item.product.name}:`, error)
      }
    }

    revalidatePath('/admin/customer-orders')
    
    // Return both the customer order and any created production orders
    return {
      customerOrder,
      productionOrders: createdProductionOrders
    }
  } catch (error) {
    console.error('Error creating customer order:', error)
    throw new Error('Failed to create customer order')
  }
}

export async function updateCustomerOrder(
  id: string,
  data: {
    status?: Status
    notes?: string
  }
) {
  try {
    const result = await prisma.customerOrder.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sellingPrice: true,
              }
            }
          }
        }
      }
    })

    // Transform to CustomerOrder type
    const updatedOrder: CustomerOrder = {
      id: result.id,
      orderNumber: result.orderNumber,
      customerId: result.customerId,
      orderDate: result.orderDate,
      requiredDate: result.requiredDate,
      status: result.status,
      totalAmount: result.totalAmount instanceof Decimal ? result.totalAmount.toNumber() : Number(result.totalAmount),
      notes: result.notes,
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        email: result.customer.email,
      },
      orderLines: result.orderLines.map(line => ({
        id: line.id,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: 0,
        status: line.status,
        product: line.product ? {
          id: line.product.id,
          name: line.product.name,
          sku: line.product.sku,
        } : undefined
      })),
    };

    revalidatePath('/admin/customer-orders')
    return updatedOrder
  } catch (error) {
    console.error('Error updating customer order:', error)
    throw new Error('Failed to update customer order')
  }
}

export async function deleteCustomerOrder(id: string) {
  try {
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        orderLines: {
          select: { id: true },
        },
      },
    })

    if (!customerOrder) {
      throw new Error('Customer order not found')
    }
    
    // Delete all order lines first
    if (customerOrder.orderLines.length > 0) {
      await prisma.orderLine.deleteMany({
        where: { orderId: id }
      })
    }

    // Then delete the order
    await prisma.customerOrder.delete({
      where: { id },
    })

    revalidatePath('/admin/customer-orders')
  } catch (error) {
    console.error('Error deleting customer order:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to delete customer order')
  }
}