import type { Status } from "@prisma/client"

export interface InspectorsTask {
  id: string
  title?: string
  description: string
  startDate: Date | null
  dueDate: Date | null
  status: Status
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  notes?: string | null
  productionOrderId: string
  workCenterId: string
  workCenterName: string
  quantity: number
  productionStatus: Status
  isActive: boolean
}

export interface TaskStatistics {
  pending: number
  inProgress: number
  completed: number
  total: number
  urgentTasks: number
  completionRate: number
  activeTasks: number
  inactiveTasks: number
}

export interface TaskUpdateInput {
  id: string
  status: Status
  notes?: string
  timeSpent?: number
}

export interface TaskTimeTracking {
  taskId: string
  startTime: Date
  endTime?: Date
  duration?: number
  isActive: boolean
}

export interface TaskReport {
  taskId: string
  issueType: "QUALITY" | "MATERIAL" | "EQUIPMENT" | "OTHER"
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH"
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
  reportedAt: Date
}

export interface QualityCheck {
  id: string
  taskId: string
  inspectorId: string
  checkDate: string
  checkType: string
  status: Status
  defectsFound?: string
  actionTaken?: string
  quantityChecked: number
  passedQuantity: number
  failedQuantity: number
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateFormData {
  taskId: string
  checkType: string
  status: Status
  defectsFound: string
  actionTaken: string
  notes: string
  quantityChecked: number
  passedQuantity: number
  failedQuantity: number
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}

export interface NotificationData {
  id?: string
  title: string
  message: string
  type: "success" | "error" | "warning" | "info"
  duration?: number
  timestamp?: string
}

export interface FilterOptions {
  status: string
  priority: string
  workCenter: string
  dateRange: {
    start?: string
    end?: string
  }
  searchTerm: string
  isActive?: boolean
}
