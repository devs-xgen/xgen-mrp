import { Status } from "@prisma/client"

export interface QualityCheck {
  id: string
  productionOrderId: string
  checkDate: Date
  inspectorId: string
  status: Status
  defectsFound?: string | null
  actionTaken?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  modifiedBy?: string | null
  productionOrder: {
    id: string
    product: {
      name: string
      sku: string
    }
  }
}

export interface QualityCheckColumn {
  id: string
  checkDate: Date
  productName: string
  productSku: string
  status: Status
  inspector: string
  defectsFound: string | null
  actionTaken: string | null
}

export interface CreateQualityCheckInput {
  productionOrderId: string
  checkDate: Date
  defectsFound?: string
  actionTaken?: string
  notes?: string
}

export interface UpdateQualityCheckInput {
  id: string
  status?: Status
  defectsFound?: string
  actionTaken?: string
  notes?: string
}