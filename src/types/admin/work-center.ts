// src/types/admin/work-center.ts
import { Status } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

export interface WorkCenter {
  id: string
  name: string
  description?: string | null
  capacityPerHour: number
  operatingHours: number
  efficiencyRate: Decimal
  status: Status
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  modifiedBy?: string | null
}

export interface CreateWorkCenterInput {
  name: string
  description?: string
  capacityPerHour: number
  operatingHours: number
  efficiencyRate: number
  status?: Status
}

export interface UpdateWorkCenterInput extends Partial<CreateWorkCenterInput> {
  id: string
}

export interface WorkCenterColumn {
  id: string
  name: string
  description: string | null
  capacityPerHour: number
  operatingHours: number
  efficiencyRate: string // Formatted as percentage
  status: Status
  createdAt: Date
  updatedAt: Date
}