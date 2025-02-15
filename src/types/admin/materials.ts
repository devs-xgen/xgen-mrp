// src/types/admin/materials.ts
import { Status, Supplier } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

export interface Material {
    id: string
    sku: string
    name: string
    typeId: string
    unitOfMeasureId: string
    costPerUnit: Decimal
    currentStock: number
    minimumStockLevel: number
    leadTime: number
    supplierId: string
    status: Status
    notes?: string | null
    type: {
      id: string
      name: string
    }
    unitOfMeasure: {
      id: string
      name: string
      symbol: string
    }
    supplier: {
      id: string
      name: string
    }
  }
  
  export interface MaterialCreateInput {
    sku: string
    name: string
    typeId: string
    unitOfMeasureId: string
    costPerUnit: number
    currentStock: number
    minimumStockLevel: number
    leadTime: number
    supplierId: string
    notes?: string
  }
  
  export interface MaterialUpdateInput extends Partial<MaterialCreateInput> {
    id: string
    status?: Status
  }