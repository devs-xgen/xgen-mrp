// src/types/admin/quality-checks.ts
import { Status } from "@prisma/client"

export interface QualityCheck {
  id: string
  productionOrderId: string
  inspectorId: string
  inspectorName?: string
  checkDate: Date
  status: Status
  defectsFound?: string | null
  actionTaken?: string | null
  notes?: string | null
  productionOrder: {
    product: {
      name: string
      sku: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface QualityCheckColumn {
  id: string
  productName: string
  productSku: string
  inspectorName: string
  checkDate: Date
  status: Status
  defectsFound: string | null
  actionTaken: string | null
}

export interface CreateQualityCheckInput {
  productionOrderId: string
  inspectorId: string
  checkDate: Date
  status?: Status  // Added status field to the input type
  defectsFound?: string
  actionTaken?: string
  notes?: string
}

export interface UpdateQualityCheckInput {
  id: string
  status?: Status
  defectsFound?: string | null
  actionTaken?: string | null
  notes?: string | null
}