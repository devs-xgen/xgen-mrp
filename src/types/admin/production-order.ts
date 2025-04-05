// src/types/admin/production-order.ts
import { Status, Priority } from "@prisma/client"

export interface ProductionOrder {
  id: string
  productId: string
  quantity: number
  startDate: Date
  dueDate: Date
  status: Status
  priority: Priority
  customerOrderId?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  modifiedBy?: string | null
  // Relations
  product: {
    id: string
    name: string
    sku: string
  }
  customerOrder?: {
    id: string
    orderNumber: string
  } | null
  operations: {
    id: string
    workCenterId: string
    startTime: Date
    endTime: Date
    status: Status
    workCenter: {
      name: string
    }
  }[]
  qualityChecks: {
    id: string
    checkDate: Date
    status: Status
    defectsFound?: string | null
    actionTaken?: string | null
  }[]
}


export interface CreateProductionOrderInput {
  productId: string
  quantity: number
  startDate: Date
  dueDate: Date
  priority: Priority
  customerOrderId?: string
  notes?: string
  operations: {
    workCenterId: string
    startTime: Date
    endTime: Date
    cost: number
  }[]
}

export interface UpdateProductionOrderInput extends Partial<CreateProductionOrderInput> {
  id: string
  status?: Status
}

export interface ProductionOrderColumn {
  id: string
  productName: string
  productSku: string
  quantity: number
  startDate: Date
  dueDate: Date
  status: Status
  priority: Priority
  customerOrderNumber?: string | undefined
  progress: number // Calculated from operations
  lastUpdated: Date
}