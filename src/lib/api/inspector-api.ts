import { DashboardStats } from "@/types/admin/dashboard"
import { FilterOptions, UpdateFormData } from "@/types/inspector/inspector"
import { ProductionOrder, QualityCheck } from "@prisma/client"


// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock database - In real app, this would be your Prisma client calls
const mockProductionOrders: ProductionOrder[] = [
  {
    id: "po-001",
    productId: "prod-001",
    productName: "Cotton T-Shirt - Medium Blue",
    quantity: 100,
    completedQuantity: 75,
    status: "IN_PROGRESS",
    priority: "HIGH",
    startDate: "2024-01-08",
    dueDate: "2024-01-15",
    createdAt: "2024-01-08T09:00:00Z",
    updatedAt: "2024-01-10T14:30:00Z",
    qualityChecks: [
      {
        id: "qc-001",
        productionOrderId: "po-001",
        inspectorId: "insp-001",
        checkDate: "2024-01-10T10:00:00Z",
        checkType: "VISUAL_INSPECTION",
        status: "COMPLETED",
        defectsFound: "Minor stitching issues on 3 units",
        actionTaken: "Rework completed",
        quantityChecked: 25,
        passedQuantity: 22,
        failedQuantity: 3,
        severity: "LOW",
        createdAt: "2024-01-10T10:00:00Z",
        updatedAt: "2024-01-10T11:00:00Z",
      },
    ],
  },
  {
    id: "po-002",
    productId: "prod-002",
    productName: "Denim Jeans - Large Black",
    quantity: 50,
    completedQuantity: 30,
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    startDate: "2024-01-09",
    dueDate: "2024-01-20",
    createdAt: "2024-01-09T08:00:00Z",
    updatedAt: "2024-01-11T16:00:00Z",
    qualityChecks: [],
  },
  {
    id: "po-003",
    productId: "prod-003",
    productName: "Polo Shirt - Small Red",
    quantity: 200,
    completedQuantity: 200,
    status: "COMPLETED",
    priority: "LOW",
    startDate: "2024-01-05",
    dueDate: "2024-01-12",
    createdAt: "2024-01-05T07:00:00Z",
    updatedAt: "2024-01-12T18:00:00Z",
    qualityChecks: [
      {
        id: "qc-002",
        productionOrderId: "po-003",
        inspectorId: "insp-001",
        checkDate: "2024-01-12T15:00:00Z",
        checkType: "FINAL_INSPECTION",
        status: "COMPLETED",
        defectsFound: "No defects found",
        actionTaken: "Approved for shipment",
        quantityChecked: 200,
        passedQuantity: 200,
        failedQuantity: 0,
        severity: "LOW",
        createdAt: "2024-01-12T15:00:00Z",
        updatedAt: "2024-01-12T16:00:00Z",
      },
    ],
  },
]

// API Functions
export const inspectorApi = {
  // Fetch all production orders with optional filtering
  async getProductionOrders(filters?: FilterOptions): Promise<ProductionOrder[]> {
    await delay(500) // Simulate API call

    let filteredOrders = [...mockProductionOrders]

    if (filters) {
      if (filters.status && filters.status !== "ALL") {
        filteredOrders = filteredOrders.filter((order) => order.status === filters.status)
      }

      if (filters.priority && filters.priority !== "ALL") {
        filteredOrders = filteredOrders.filter((order) => order.priority === filters.priority)
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        filteredOrders = filteredOrders.filter(
          (order) =>
            order.productName.toLowerCase().includes(searchLower) || order.id.toLowerCase().includes(searchLower),
        )
      }

      if (filters.dateRange.start) {
        filteredOrders = filteredOrders.filter((order) => new Date(order.dueDate) >= new Date(filters.dateRange.start!))
      }

      if (filters.dateRange.end) {
        filteredOrders = filteredOrders.filter((order) => new Date(order.dueDate) <= new Date(filters.dateRange.end!))
      }
    }

    return filteredOrders
  },

  // Fetch single production order
  async getProductionOrder(id: string): Promise<ProductionOrder | null> {
    await delay(300)
    return mockProductionOrders.find((order) => order.id === id) || null
  },

  // Fetch dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(400)

    const totalOrders = mockProductionOrders.length
    const inProgress = mockProductionOrders.filter((o) => o.status === "IN_PROGRESS").length
    const completed = mockProductionOrders.filter((o) => o.status === "COMPLETED").length
    const issuesFound = mockProductionOrders.filter((o) =>
      o.qualityChecks.some((qc) => qc.defectsFound && qc.defectsFound !== "No defects found"),
    ).length

    const today = new Date().toISOString().split("T")[0]
    const todayInspections = mockProductionOrders.reduce(
      (count, order) => count + order.qualityChecks.filter((qc) => qc.checkDate.startsWith(today)).length,
      0,
    )

    const pendingInspections = mockProductionOrders.filter(
      (o) => o.status === "IN_PROGRESS" && o.qualityChecks.length === 0,
    ).length

    return {
      totalOrders,
      inProgress,
      completed,
      issuesFound,
      pendingInspections,
      todayInspections,
    }
  },

  // Create new quality check update
  async createQualityCheck(data: UpdateFormData): Promise<QualityCheck> {
    await delay(800) // Simulate processing time

    const newQualityCheck: QualityCheck = {
      id: `qc-${Date.now()}`,
      productionOrderId: data.productionOrderId,
      inspectorId: "current-inspector-id", // Would come from auth context
      checkDate: new Date().toISOString(),
      checkType: data.checkType,
      status: data.status as any,
      defectsFound: data.defectsFound,
      actionTaken: data.actionTaken,
      quantityChecked: data.quantityChecked,
      passedQuantity: data.passedQuantity,
      failedQuantity: data.failedQuantity,
      severity: data.severity,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Update the mock database
    const orderIndex = mockProductionOrders.findIndex((o) => o.id === data.productionOrderId)
    if (orderIndex !== -1) {
      mockProductionOrders[orderIndex].qualityChecks.push(newQualityCheck)
      mockProductionOrders[orderIndex].updatedAt = new Date().toISOString()
    }

    return newQualityCheck
  },

  // Update existing quality check
  async updateQualityCheck(id: string, data: Partial<UpdateFormData>): Promise<QualityCheck | null> {
    await delay(600)

    for (const order of mockProductionOrders) {
      const checkIndex = order.qualityChecks.findIndex((qc) => qc.id === id)
      if (checkIndex !== -1) {
        const existingCheck = order.qualityChecks[checkIndex]
        const updatedCheck = {
          ...existingCheck,
          ...data,
          updatedAt: new Date().toISOString(),
        }
        order.qualityChecks[checkIndex] = updatedCheck
        return updatedCheck
      }
    }

    return null
  },

  // Delete quality check
  async deleteQualityCheck(id: string): Promise<boolean> {
    await delay(400)

    for (const order of mockProductionOrders) {
      const checkIndex = order.qualityChecks.findIndex((qc) => qc.id === id)
      if (checkIndex !== -1) {
        order.qualityChecks.splice(checkIndex, 1)
        return true
      }
    }

    return false
  },

  // Get quality checks for a specific production order
  async getQualityChecks(productionOrderId: string): Promise<QualityCheck[]> {
    await delay(300)

    const order = mockProductionOrders.find((o) => o.id === productionOrderId)
    return order?.qualityChecks || []
  },

  // Bulk update production order status
  async updateProductionOrderStatus(id: string, status: ProductionOrder["status"]): Promise<ProductionOrder | null> {
    await delay(500)

    const orderIndex = mockProductionOrders.findIndex((o) => o.id === id)
    if (orderIndex !== -1) {
      mockProductionOrders[orderIndex].status = status
      mockProductionOrders[orderIndex].updatedAt = new Date().toISOString()
      return mockProductionOrders[orderIndex]
    }

    return null
  },
}
