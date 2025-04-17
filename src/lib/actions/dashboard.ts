'use server'

import { prisma } from "@/lib/db"
import { Decimal } from "@prisma/client/runtime/library"
import { 
  DashboardStats, 
  InventoryAlert,
  MaterialAlert,
  ProductPerformance,
  SupplierPerformance,
  ProductionStatus,
  SalesByCategoryData,
  MonthlySalesData,
  WeeklySalesData,
  RecentOrder,
  QualityMetrics,
  ProductionEfficiency,
  MaterialUtilization,
  CustomerInsights,
  OperationalAlerts,
  DashboardData
} from "@/types/admin/dashboard"
import { addMonths, subMonths, format, differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks } from "date-fns"

/**
 * Get all dashboard data in a single call to minimize loading time
 */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [
      stats,
      inventoryAlerts,
      materialAlerts,
      topProducts,
      topSuppliers,
      productionStatus,
      salesByCategory,
      monthlySales,
      weeklySales,
      recentOrders,
      qualityMetrics,
      productionEfficiency,
      materialUtilization,
      topCustomers,
      operationalAlerts
    ] = await Promise.all([
      getStats(),
      getInventoryAlerts(),
      getMaterialAlerts(),
      getTopPerformingProducts(),
      getSupplierPerformance(),
      getProductionStatus(),
      getSalesByCategory(),
      getMonthlySales(),
      getWeeklySales(),
      getRecentOrders(),
      getQualityMetrics(),
      getProductionEfficiency(),
      getMaterialUtilization(),
      getTopCustomers(),
      getOperationalAlerts()
    ])

    return {
      stats,
      inventoryAlerts,
      materialAlerts,
      topProducts,
      topSuppliers,
      productionStatus,
      salesByCategory,
      monthlySales,
      weeklySales,
      recentOrders,
      qualityMetrics,
      productionEfficiency,
      materialUtilization,
      topCustomers,
      operationalAlerts
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    throw new Error('Failed to fetch dashboard data')
  }
}


export async function getStats(): Promise<DashboardStats> {
    try {
      const now = new Date()
      const lastMonth = subMonths(now, 1)
      
      // Get current counts
      const totalProducts = await prisma.product.count()
      const activeOrders = await prisma.customerOrder.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      })
      const totalUsers = await prisma.user.count()
      
      // Calculate total revenue from all completed transactions
      const totalRevenueResult = await prisma.transaction.aggregate({
        _sum: { 
          amount: true 
        },
        where: {
          status: 'COMPLETED'
        }
      })
      const totalRevenue = totalRevenueResult._sum.amount || new Decimal(0)
      
      // Get previous month counts for growth calculations
      const prevMonthOrders = await prisma.customerOrder.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          createdAt: {
            lt: startOfMonth(now)
          }
        }
      })
      
      const prevMonthRevenue = await prisma.transaction.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth(lastMonth),
            lt: endOfMonth(lastMonth)
          }
        }
      })
      
      const prevMonthProducts = await prisma.product.count({
        where: {
          createdAt: {
            lt: startOfMonth(now)
          }
        }
      })
      
      const prevMonthUsers = await prisma.user.count({
        where: {
          createdAt: {
            lt: startOfMonth(now)
          }
        }
      })
      
      // Calculate growth percentages
      const ordersGrowth = prevMonthOrders === 0 
        ? '+100%' 
        : `${((activeOrders - prevMonthOrders) / prevMonthOrders * 100).toFixed(1)}%`
      
      const revenueGrowth = !prevMonthRevenue._sum.amount || prevMonthRevenue._sum.amount.equals(0)
        ? '+100%'
        : `${(totalRevenue.minus(prevMonthRevenue._sum.amount || 0).div(prevMonthRevenue._sum.amount || 1).mul(100)).toFixed(1)}%`
      
      const productsGrowth = prevMonthProducts === 0
        ? '+100%'
        : `${((totalProducts - prevMonthProducts) / prevMonthProducts * 100).toFixed(1)}%`
      
      const usersGrowth = prevMonthUsers === 0
        ? '+100%'
        : `${((totalUsers - prevMonthUsers) / prevMonthUsers * 100).toFixed(1)}%`
      
      // Convert Decimal to string before returning
      return {
        totalRevenue: totalRevenue.toFixed(2), // Convert to string with 2 decimal places
        totalProducts,
        activeOrders,
        totalUsers,
        revenueGrowth,
        productsGrowth,
        ordersGrowth,
        usersGrowth
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      throw new Error('Failed to fetch dashboard stats')
    }
  }


/**
 * Get inventory items that are below or nearing minimum stock levels (fixed)
 */
export async function getInventoryAlerts(): Promise<InventoryAlert[]> {
    try {
      // Get all products
      const products = await prisma.product.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          sku: true,
          name: true,
          currentStock: true,
          minimumStockLevel: true,
          leadTime: true,
          // Include order lines to calculate consumption rate
          orderLines: {
            where: {
              createdAt: {
                gte: subMonths(new Date(), 1)
              }
            },
            select: {
              quantity: true,
              createdAt: true
            }
          }
        }
      });
  
      // Filter products with low stock and calculate metrics
      const alerts = products
        .filter(product => {
          // Check if stock is at or below 120% of minimum level
          return product.currentStock <= (product.minimumStockLevel * 1.2);
        })
        .map(product => {
          // Calculate average daily consumption
          const totalOrdered = product.orderLines.reduce((sum, line) => sum + line.quantity, 0);
          const dailyConsumption = totalOrdered / 30; // Assuming 30 days period
          
          // Calculate days until stockout
          const daysUntilStockout = dailyConsumption === 0 
            ? null 
            : Math.floor(product.currentStock / dailyConsumption);
          
          // Determine alert status
          let status: 'CRITICAL' | 'WARNING' | 'OK' = 'OK';
          
          if (product.currentStock <= product.minimumStockLevel) {
            status = 'CRITICAL';
          } else if (product.currentStock <= product.minimumStockLevel * 1.2) {
            status = 'WARNING';
          }
  
          return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            currentStock: product.currentStock,
            minimumStockLevel: product.minimumStockLevel,
            leadTime: product.leadTime,
            daysUntilStockout,
            status
          };
        });
  
      // Sort by status severity, then by days until stockout
      return alerts.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'CRITICAL' ? -1 : b.status === 'CRITICAL' ? 1 : a.status === 'WARNING' ? -1 : 1;
        }
        
        if (a.daysUntilStockout === null) return 1;
        if (b.daysUntilStockout === null) return -1;
        return a.daysUntilStockout - b.daysUntilStockout;
      });
    } catch (error) {
      console.error('Failed to fetch inventory alerts:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

export async function getMaterialAlerts(): Promise<MaterialAlert[]> {
    try {
      // Get all materials
      const materials = await prisma.material.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          sku: true,
          name: true,
          currentStock: true,
          minimumStockLevel: true,
          leadTime: true,
          // Include BOMs to estimate usage rate
          boms: {
            select: {
              quantityNeeded: true,
              product: {
                select: {
                  orderLines: {
                    where: {
                      createdAt: {
                        gte: subMonths(new Date(), 1)
                      }
                    },
                    select: {
                      quantity: true
                    }
                  }
                }
              }
            }
          }
        }
      });
  
      // Filter materials with low stock and calculate metrics
      const alerts = materials
        .filter(material => {
          // Check if stock is at or below 120% of minimum level
          return material.currentStock <= (material.minimumStockLevel * 1.2);
        })
        .map(material => {
          // Calculate material consumption based on product orders
          let totalMaterialUsed = new Decimal(0);
          
          material.boms.forEach(bom => {
            const productOrderQuantity = bom.product.orderLines.reduce((sum, line) => sum + line.quantity, 0);
            const materialQuantityNeeded = bom.quantityNeeded;
            totalMaterialUsed = totalMaterialUsed.plus(materialQuantityNeeded.mul(productOrderQuantity));
          });
          
          const dailyConsumption = totalMaterialUsed.div(30).toNumber(); // Assuming 30 days period
          
          // Calculate days until stockout
          const daysUntilStockout = dailyConsumption === 0 
            ? null 
            : Math.floor(material.currentStock / dailyConsumption);
          
          // Determine alert status
          let status: 'CRITICAL' | 'WARNING' | 'OK' = 'OK';
          
          if (material.currentStock <= material.minimumStockLevel) {
            status = 'CRITICAL';
          } else if (material.currentStock <= material.minimumStockLevel * 1.2) {
            status = 'WARNING';
          }
  
          return {
            id: material.id,
            sku: material.sku,
            name: material.name,
            currentStock: material.currentStock,
            minimumStockLevel: material.minimumStockLevel,
            leadTime: material.leadTime,
            daysUntilStockout,
            status
          };
        });
  
      // Sort by status severity, then by days until stockout
      return alerts.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'CRITICAL' ? -1 : b.status === 'CRITICAL' ? 1 : a.status === 'WARNING' ? -1 : 1;
        }
        
        if (a.daysUntilStockout === null) return 1;
        if (b.daysUntilStockout === null) return -1;
        return a.daysUntilStockout - b.daysUntilStockout;
      });
    } catch (error) {
      console.error('Failed to fetch material alerts:', error);
      // Return empty array instead of throwing
      return [];
    }
  }
/**
 * Get top performing products based on sales and revenue
 */
export async function getTopPerformingProducts(limit: number = 5): Promise<ProductPerformance[]> {
  try {
    // Get products with their order lines
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        orderLines: {
          some: {
            createdAt: {
              gte: subMonths(new Date(), 3) // Last 3 months
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        unitCost: true,
        sellingPrice: true,
        orderLines: {
          where: {
            createdAt: {
              gte: subMonths(new Date(), 3)
            }
          },
          select: {
            quantity: true,
            unitPrice: true
          }
        }
      }
    })

    // Calculate performance metrics for each product
    const productPerformance = products.map(product => {
      const salesCount = product.orderLines.reduce((sum, line) => sum + line.quantity, 0)
      const revenue = product.orderLines.reduce(
        (sum, line) => sum.plus(new Decimal(line.quantity).mul(line.unitPrice)), 
        new Decimal(0)
      )
      const cost = new Decimal(salesCount).mul(product.unitCost)
      const profit = revenue.minus(cost)
      const profitMargin = revenue.equals(0) ? 0 : profit.div(revenue).mul(100).toNumber()

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        salesCount,
        revenue,
        profit,
        profitMargin
      }
    })

    // Sort by revenue and return top products
    return productPerformance
  .sort((a, b) => b.revenue.minus(a.revenue).toNumber())
  .slice(0, limit)
  } catch (error) {
    console.error('Failed to fetch top performing products:', error)
    throw new Error('Failed to fetch top performing products')
  }
}

/**
 * Get supplier performance metrics
 */
export async function getSupplierPerformance(limit: number = 5): Promise<SupplierPerformance[]> {
  try {
    // Get suppliers with their purchase orders
    const suppliers = await prisma.supplier.findMany({
      where: {
        status: 'ACTIVE',
        purchaseOrders: {
          some: {
            createdAt: {
              gte: subMonths(new Date(), 6) // Last 6 months
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
        purchaseOrders: {
          where: {
            createdAt: {
              gte: subMonths(new Date(), 6)
            }
          },
          select: {
            expectedDelivery: true,
            orderDate: true,
            status: true,
            totalAmount: true
          }
        }
      }
    })

    // Calculate performance metrics for each supplier
    const supplierPerformance = suppliers.map(supplier => {
      const ordersCount = supplier.purchaseOrders.length
      
      // Calculate on-time delivery rate
      const completedOrders = supplier.purchaseOrders.filter(po => po.status === 'COMPLETED')
      const onTimeDeliveries = completedOrders.filter(po => {
        const deliveryDate = new Date(po.expectedDelivery)
        return deliveryDate >= new Date(po.orderDate)
      })
      
      const onTimeDeliveryRate = completedOrders.length === 0 
        ? 0 
        : (onTimeDeliveries.length / completedOrders.length) * 100
      
      // Calculate average lead time in days
      const leadTimes = completedOrders.map(po => 
        differenceInDays(new Date(po.expectedDelivery), new Date(po.orderDate))
      )
      
      const averageLeadTime = leadTimes.length === 0 
        ? 0 
        : leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length
      
      // Calculate total spent
      const totalSpent = supplier.purchaseOrders.reduce(
        (sum, po) => sum.plus(po.totalAmount), 
        new Decimal(0)
      )

      return {
        id: supplier.id,
        name: supplier.name,
        code: supplier.code,
        ordersCount,
        onTimeDeliveryRate,
        averageLeadTime,
        totalSpent
      }
    })

    // Sort by total spent and return top suppliers
    return supplierPerformance
      .sort((a, b) => b.totalSpent.minus(a.totalSpent).toNumber())
      .slice(0, limit)
  } catch (error) {
    console.error('Failed to fetch supplier performance:', error)
    throw new Error('Failed to fetch supplier performance')
  }
}

/**
 * Get current production status statistics
 */
export async function getProductionStatus(): Promise<ProductionStatus> {
  try {
    // Get counts of production orders by status
    const totalOrders = await prisma.productionOrder.count()
    const pendingOrders = await prisma.productionOrder.count({
      where: { status: 'PENDING' }
    })
    const inProgressOrders = await prisma.productionOrder.count({
      where: { status: 'IN_PROGRESS' }
    })
    const completedOrders = await prisma.productionOrder.count({
      where: { status: 'COMPLETED' }
    })

    // Calculate percentages
    const pendingPercentage = totalOrders === 0 ? 0 : (pendingOrders / totalOrders) * 100
    const inProgressPercentage = totalOrders === 0 ? 0 : (inProgressOrders / totalOrders) * 100
    const completedPercentage = totalOrders === 0 ? 0 : (completedOrders / totalOrders) * 100

    return {
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      pendingPercentage,
      inProgressPercentage,
      completedPercentage
    }
  } catch (error) {
    console.error('Failed to fetch production status:', error)
    throw new Error('Failed to fetch production status')
  }
}

/**
 * Get sales data grouped by product category
 */
export async function getSalesByCategory(): Promise<SalesByCategoryData[]> {
  try {
    // Get all product categories
    const categories = await prisma.productCategory.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        products: {
          select: {
            id: true,
            orderLines: {
              where: {
                createdAt: {
                  gte: subMonths(new Date(), 6) // Last 6 months
                }
              },
              select: {
                quantity: true,
                unitPrice: true
              }
            }
          }
        }
      }
    })

    // Calculate sales data for each category
    const salesByCategory = categories.map(category => {
      let salesCount = 0
      let revenue = new Decimal(0)

      // Calculate total sales and revenue for the category
      category.products.forEach(product => {
        product.orderLines.forEach(line => {
          salesCount += line.quantity
          revenue = revenue.plus(new Decimal(line.quantity).mul(line.unitPrice))
        })
      })

      return {
        categoryId: category.id,
        categoryName: category.name,
        salesCount,
        revenue,
        percentage: 0 // Will calculate after totals are known
      }
    })

    // Calculate total revenue across all categories
    const totalRevenue = salesByCategory.reduce(
      (sum, category) => sum.plus(category.revenue), 
      new Decimal(0)
    )

    // Calculate percentage of total for each category
    const result = salesByCategory.map(category => ({
      ...category,
      percentage: totalRevenue.equals(0) 
        ? 0 
        : category.revenue.div(totalRevenue).mul(100).toNumber()
    }))

    // Sort by revenue in descending order
    return result.sort((a, b) => b.revenue.minus(a.revenue).toNumber())
  } catch (error) {
    console.error('Failed to fetch sales by category:', error)
    throw new Error('Failed to fetch sales by category')
  }
}


export async function getMonthlySales(): Promise<MonthlySalesData[]> {
    try {
      const now = new Date()
      const monthsData: MonthlySalesData[] = []
  
      // Generate data for the last 12 months
      for (let i = 0; i < 12; i++) {
        const monthStart = startOfMonth(subMonths(now, i))
        const monthEnd = endOfMonth(subMonths(now, i))
        const monthLabel = format(monthStart, 'MMM')
        const year = monthStart.getFullYear()
  
        // Get orders for this month
        const orders = await prisma.customerOrder.findMany({
          where: {
            orderDate: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          select: {
            id: true,
            totalAmount: true
          }
        })
  
        // Calculate monthly stats
        const ordersCount = orders.length
        const revenue = orders.reduce(
          (sum, order) => sum.plus(order.totalAmount), 
          new Decimal(0)
        )
  
        // Convert Decimal to string before returning
        monthsData.push({
          month: monthLabel,
          revenue: revenue.toFixed(2), // Convert to string with 2 decimal places
          orders: ordersCount,
          year
        })
      }
  
      // Return in chronological order (oldest to newest)
      return monthsData.reverse()
    } catch (error) {
      console.error('Failed to fetch monthly sales:', error)
      throw new Error('Failed to fetch monthly sales')
    }
  }


/**
 * Get weekly sales data for the past 8 weeks
 */
export async function getWeeklySales(): Promise<WeeklySalesData[]> {
  try {
    const now = new Date()
    const weeksData: WeeklySalesData[] = []

    // Generate data for the last 8 weeks
    for (let i = 0; i < 8; i++) {
      const weekStart = startOfWeek(subWeeks(now, i))
      const weekEnd = endOfWeek(subWeeks(now, i))
      const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`

      // Get orders for this week
      const orders = await prisma.customerOrder.findMany({
        where: {
          orderDate: {
            gte: weekStart,
            lte: weekEnd
          }
        },
        select: {
          id: true,
          totalAmount: true
        }
      })

      // Calculate weekly stats
      const ordersCount = orders.length
      const revenue = orders.reduce(
        (sum, order) => sum.plus(order.totalAmount), 
        new Decimal(0)
      )

      weeksData.push({
        week: weekLabel,
        revenue,
        orders: ordersCount
      })
    }

    // Return in chronological order (oldest to newest)
    return weeksData.reverse()
  } catch (error) {
    console.error('Failed to fetch weekly sales:', error)
    throw new Error('Failed to fetch weekly sales')
  }
}

/**
 * Get recent customer orders
 */
export async function getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
  try {
    const orders = await prisma.customerOrder.findMany({
      take: limit,
      orderBy: {
        orderDate: 'desc'
      },
      select: {
        id: true,
        orderNumber: true,
        orderDate: true,
        totalAmount: true,
        status: true,
        customer: {
          select: {
            name: true
          }
        }
      }
    })

    return orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      date: order.orderDate,
      amount: order.totalAmount,
      status: order.status
    }))
  } catch (error) {
    console.error('Failed to fetch recent orders:', error)
    throw new Error('Failed to fetch recent orders')
  }
}

/**
 * Get production efficiency metrics by work center
 */
export async function getProductionEfficiency(): Promise<ProductionEfficiency[]> {
  try {
    // Get work centers with their operations
    const workCenters = await prisma.workCenter.findMany({
      where: {
        status: 'ACTIVE',
        operations: {
          some: {
            createdAt: {
              gte: subMonths(new Date(), 1) // Last month
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        capacityPerHour: true,
        operations: {
          where: {
            createdAt: {
              gte: subMonths(new Date(), 1)
            }
          },
          select: {
            startTime: true,
            endTime: true,
            status: true,
            cost: true,
            productionOrder: {
              select: {
                quantity: true
              }
            }
          }
        }
      }
    })

    return workCenters.map(wc => {
      // Calculate planned output based on capacity and operation hours
      let totalOperationHours = 0
      wc.operations.forEach(op => {
        const startTime = new Date(op.startTime)
        const endTime = new Date(op.endTime)
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        totalOperationHours += hours
      })

      const plannedOutput = wc.capacityPerHour * totalOperationHours

      // Calculate actual output from production orders
      const actualOutput = wc.operations.reduce((sum, op) => 
        sum + (op.status === 'COMPLETED' ? op.productionOrder.quantity : 0), 0
      )

      // Calculate efficiency
      const efficiency = plannedOutput === 0 ? 0 : (actualOutput / plannedOutput) * 100

      // Calculate total cost
      const cost = wc.operations.reduce((sum, op) => sum.plus(op.cost), new Decimal(0))

      return {
        workCenterId: wc.id,
        workCenterName: wc.name,
        plannedOutput,
        actualOutput,
        efficiency,
        cost
      }
    }).sort((a, b) => b.efficiency - a.efficiency)
  } catch (error) {
    console.error('Failed to fetch production efficiency:', error)
    throw new Error('Failed to fetch production efficiency')
  }
}

/**
 * Get material utilization and wastage metrics
 */
export async function getMaterialUtilization(): Promise<MaterialUtilization[]> {
  try {
    // Get materials with their BOMs
    const materials = await prisma.material.findMany({
      where: {
        status: 'ACTIVE',
        boms: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        costPerUnit: true,
        boms: {
          select: {
            quantityNeeded: true,
            wastePercentage: true,
            product: {
              select: {
                productionOrders: {
                  where: {
                    createdAt: {
                      gte: subMonths(new Date(), 1) // Last month
                    },
                    status: 'COMPLETED'
                  },
                  select: {
                    quantity: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return materials.map(material => {
      let plannedUsage = new Decimal(0)
      let actualUsage = new Decimal(0)
      
      // Calculate planned and actual usage based on BOMs and production orders
      material.boms.forEach(bom => {
        const productionQuantity = bom.product.productionOrders.reduce(
          (sum, po) => sum + po.quantity, 0
        )
        
        // Base material needed without waste
        const baseMaterialNeeded = bom.quantityNeeded.mul(productionQuantity)
        plannedUsage = plannedUsage.plus(baseMaterialNeeded)
        
        // Actual material used including waste
        const actualMaterialUsed = baseMaterialNeeded.mul(
          new Decimal(1).plus(bom.wastePercentage.div(100))
        )
        actualUsage = actualUsage.plus(actualMaterialUsed)
      })
      
      // Calculate wastage
      const wastage = actualUsage.minus(plannedUsage)
      const wastagePercentage = plannedUsage.equals(0) 
        ? 0 
        : wastage.div(plannedUsage).mul(100).toNumber()
      
      // Calculate cost impact
      const costImpact = wastage.mul(material.costPerUnit)

      return {
        materialId: material.id,
        materialName: material.name,
        planned: plannedUsage.toNumber(),
        actual: actualUsage.toNumber(),
        wastage: wastage.toNumber(),
        wastagePercentage,
        costImpact
      }
    }).sort((a, b) => b.costImpact.minus(a.costImpact).toNumber())
  } catch (error) {
    console.error('Failed to fetch material utilization:', error)
    throw new Error('Failed to fetch material utilization')
  }
}

/**
 * Get top customers by total spent
 */
export async function getTopCustomers(limit: number = 5): Promise<CustomerInsights[]> {
  try {
    // Get customers with their orders
    const customers = await prisma.customer.findMany({
      where: {
        status: 'ACTIVE',
        orders: {
          some: {
            createdAt: {
              gte: subMonths(new Date(), 6) // Last 6 months
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        orders: {
          orderBy: {
            orderDate: 'desc'
          },
          select: {
            orderDate: true,
            totalAmount: true
          }
        }
      }
    })

    const customerInsights = customers.map(customer => {
      const totalOrders = customer.orders.length
      const totalSpent = customer.orders.reduce(
        (sum, order) => sum.plus(order.totalAmount), 
        new Decimal(0)
      )
      const averageOrderValue = totalOrders === 0 
        ? new Decimal(0) 
        : totalSpent.div(totalOrders)
      const lastOrderDate = customer.orders.length > 0 
        ? customer.orders[0].orderDate 
        : new Date()

      return {
        id: customer.id,
        name: customer.name,
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate
      }
    })

    // Sort by total spent and return top customers
    return customerInsights
      .sort((a, b) => b.totalSpent.minus(a.totalSpent).toNumber())
      .slice(0, limit)
  } catch (error) {
    console.error('Failed to fetch top customers:', error)
    throw new Error('Failed to fetch top customers')
  }
}



export async function getOperationalAlerts(): Promise<OperationalAlerts> {
    try {
      const now = new Date();
      let productStockAlerts = 0;
      let materialStockAlerts = 0;
      let lateProductionOrders = 0;
      let qualityIssues = 0;
      let lateDeliveries = 0;
      let pendingApprovals = 0;
      
      try {
        // Get all products and filter in JavaScript instead of using raw SQL or multiply
        const products = await prisma.product.findMany({
          where: { status: 'ACTIVE' },
          select: {
            currentStock: true,
            minimumStockLevel: true
          }
        });
        
        // Filter products with low stock in JavaScript
        productStockAlerts = products.filter(product => 
          product.currentStock <= (product.minimumStockLevel * 1.2)
        ).length;
      } catch (e) {
        console.error('Error counting product stock alerts:', e);
      }
      
      try {
        // Get all materials and filter in JavaScript
        const materials = await prisma.material.findMany({
          where: { status: 'ACTIVE' },
          select: {
            currentStock: true,
            minimumStockLevel: true
          }
        });
        
        // Filter materials with low stock in JavaScript
        materialStockAlerts = materials.filter(material => 
          material.currentStock <= (material.minimumStockLevel * 1.2)
        ).length;
      } catch (e) {
        console.error('Error counting material stock alerts:', e);
      }
      
      try {
        // Count late production orders
        lateProductionOrders = await prisma.productionOrder.count({
          where: {
            dueDate: {
              lt: now
            },
            status: {
              in: ['PENDING', 'IN_PROGRESS']
            }
          }
        });
      } catch (e) {
        console.error('Error counting late production orders:', e);
      }
      
      try {
        // Count quality issues
        qualityIssues = await prisma.qualityCheck.count({
          where: {
            checkDate: {
              gte: subMonths(now, 1)
            },
            defectsFound: {
              not: null
            }
          }
        });
      } catch (e) {
        console.error('Error counting quality issues:', e);
      }
      
      try {
        // Count late deliveries
        lateDeliveries = await prisma.customerOrder.count({
          where: {
            requiredDate: {
              lt: now
            },
            status: {
              in: ['PENDING', 'IN_PROGRESS']
            }
          }
        });
      } catch (e) {
        console.error('Error counting late deliveries:', e);
      }
      
      try {
        // Count pending approvals (purchase orders awaiting approval)
        pendingApprovals = await prisma.purchaseOrder.count({
          where: {
            status: 'PENDING'
          }
        });
      } catch (e) {
        console.error('Error counting pending approvals:', e);
      }
  
      return {
        productStockAlerts,
        materialStockAlerts,
        lateProductionOrders,
        qualityIssues,
        lateDeliveries,
        pendingApprovals
      };
    } catch (error) {
      console.error('Failed to fetch operational alerts:', error);
      // Return default values instead of throwing
      return {
        productStockAlerts: 0,
        materialStockAlerts: 0,
        lateProductionOrders: 0,
        qualityIssues: 0,
        lateDeliveries: 0,
        pendingApprovals: 0
      };
    }
  }


export async function getQualityMetrics(): Promise<QualityMetrics> {
  try {
    // Get all quality checks
    const qualityChecks = await prisma.qualityCheck.findMany({
      where: {
        checkDate: {
          gte: subMonths(new Date(), 3) // Last 3 months
        }
      },
      select: {
        status: true,
        defectsFound: true
      }
    })

    const totalChecks = qualityChecks.length
    const passedChecks = qualityChecks.filter(check => 
      check.status === 'COMPLETED' && (!check.defectsFound || check.defectsFound.trim() === '')
    ).length
    const failedChecks = totalChecks - passedChecks

    // Calculate rates
    const passRate = totalChecks === 0 ? 0 : (passedChecks / totalChecks) * 100
    const failRate = totalChecks === 0 ? 0 : (failedChecks / totalChecks) * 100

    // Analyze defects
    const defectsMap = new Map<string, number>()
    qualityChecks.forEach(check => {
      if (check.defectsFound) {
        // Assuming defectsFound is a comma-separated string of defect types
        const defects = check.defectsFound.split(',').map(d => d.trim())
        defects.forEach(defect => {
          defectsMap.set(defect, (defectsMap.get(defect) || 0) + 1)
        })
      }
    })

    // Convert to sorted array
    const topDefects = Array.from(defectsMap.entries())
      .map(([defect, count]) => ({
        defect,
        count,
        percentage: totalChecks === 0 ? 0 : (count / totalChecks) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 defects

    return {
      totalChecks,
      passRate,
      failRate,
      topDefects
    }
  } catch (error) {
    console.error('Failed to fetch quality metrics:', error)
    throw new Error('Failed to fetch quality metrics')
  }
}