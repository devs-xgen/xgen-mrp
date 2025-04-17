// src/types/admin/dashboard.ts
import { Decimal } from "@prisma/client/runtime/library"

export function convertDecimals(obj: any): any {
  if (obj instanceof Decimal) {
    return obj.toNumber()
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDecimals)
  }

  if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, any> = {}
    for (const key in obj) {
      newObj[key] = convertDecimals(obj[key])
    }
    return newObj
  }

  return obj
}

export interface DashboardStats {
    totalRevenue: string;
    totalProducts: number;
    activeOrders: number;
    totalUsers: number;
    revenueGrowth: string;
    productsGrowth: string;
    ordersGrowth: string;
    usersGrowth: string;
  }


export interface ProductPerformance {
  id: string
  name: string
  sku: string
  salesCount: number
  revenue: Decimal
  profit: Decimal
  profitMargin: number
}

export interface InventoryAlert {
  id: string
  sku: string
  name: string
  currentStock: number
  minimumStockLevel: number
  leadTime: number
  daysUntilStockout: number | null
  status: 'CRITICAL' | 'WARNING' | 'OK'
}

export interface MaterialAlert {
  id: string
  name: string
  sku: string
  currentStock: number
  minimumStockLevel: number
  leadTime: number
  daysUntilStockout: number | null
  status: 'CRITICAL' | 'WARNING' | 'OK'
}

export interface SupplierPerformance {
  id: string
  name: string
  code: string
  ordersCount: number
  onTimeDeliveryRate: number
  averageLeadTime: number
  totalSpent: Decimal
}

export interface ProductionStatus {
  totalOrders: number
  pendingOrders: number
  inProgressOrders: number
  completedOrders: number
  pendingPercentage: number
  inProgressPercentage: number
  completedPercentage: number
}

export interface SalesByCategoryData {
  categoryId: string
  categoryName: string
  salesCount: number
  revenue: Decimal
  percentage: number
}

export interface MonthlySalesData {
    month: string;
    revenue: string;
    orders: number;
    year: number;
  }

export interface WeeklySalesData {
  week: string
  revenue: Decimal
  orders: number
}

export interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  date: Date
  amount: Decimal
  status: string
}

export interface QualityMetrics {
  totalChecks: number
  passRate: number
  failRate: number
  topDefects: Array<{
    defect: string
    count: number
    percentage: number
  }>
}

export interface ProductionEfficiency {
  workCenterId: string
  workCenterName: string
  plannedOutput: number
  actualOutput: number
  efficiency: number
  cost: Decimal
}

export interface MaterialUtilization {
  materialId: string
  materialName: string
  planned: number
  actual: number
  wastage: number
  wastagePercentage: number
  costImpact: Decimal
}

export interface CustomerInsights {
  id: string
  name: string
  totalOrders: number
  totalSpent: Decimal
  averageOrderValue: Decimal
  lastOrderDate: Date
}

export interface OperationalAlerts {
  productStockAlerts: number
  materialStockAlerts: number
  lateProductionOrders: number
  qualityIssues: number
  lateDeliveries: number
  pendingApprovals: number
}

export interface DashboardData {
  stats: DashboardStats
  inventoryAlerts: InventoryAlert[]
  materialAlerts: MaterialAlert[]
  topProducts: ProductPerformance[]
  topSuppliers: SupplierPerformance[]
  productionStatus: ProductionStatus
  salesByCategory: SalesByCategoryData[]
  monthlySales: MonthlySalesData[]
  weeklySales: WeeklySalesData[]
  recentOrders: RecentOrder[]
  qualityMetrics: QualityMetrics
  productionEfficiency: ProductionEfficiency[]
  materialUtilization: MaterialUtilization[]
  topCustomers: CustomerInsights[]
  operationalAlerts: OperationalAlerts
}