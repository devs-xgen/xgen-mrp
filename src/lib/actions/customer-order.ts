'use server'

import { prisma } from "@/lib/db"
import { CustomerOrder, CreateCustomerOrderInput } from "@/types/admin/customer-order"
import { Status } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library" 
import { revalidatePath } from "next/cache"

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

export async function createCustomerOrder(data: CreateCustomerOrderInput) {
  try {
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

    revalidatePath('/admin/customer-orders')
    return customerOrder
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