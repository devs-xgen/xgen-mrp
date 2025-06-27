"use server"

import { FilterOptions, InspectorsTask, QualityCheck, TaskStatistics, UpdateFormData } from "@/types/inspector/inspector"

// Client-side API functions that call server actions
export const inspectorClientApi = {
  // Fetch tasks with client-side filtering
  async getTasks(filters?: FilterOptions): Promise<InspectorsTask[]> {
    try {
      // Import server actions dynamically to avoid SSR issues
      const { getMyTasks, getProductionTasks } = await import("@/lib/actions/inspector/tasks")

      let tasks: InspectorsTask[]

      // Determine which tasks to fetch based on filters
      if (filters?.isActive !== undefined) {
        tasks = await getProductionTasks()
      } else {
        tasks = await getMyTasks()
      }

      // Apply client-side filtering
      if (filters) {
        tasks = tasks.filter((task) => {
          // Status filter
          if (filters.status && filters.status !== "ALL" && task.status !== filters.status) {
            return false
          }

          // Priority filter
          if (filters.priority && filters.priority !== "ALL" && task.priority !== filters.priority) {
            return false
          }

          // Work center filter
          if (filters.workCenter && filters.workCenter !== "ALL" && task.workCenterName !== filters.workCenter) {
            return false
          }

          // Search term filter
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase()
            const matchesSearch =
              task.description.toLowerCase().includes(searchLower) ||
              task.workCenterName.toLowerCase().includes(searchLower) ||
              task.id.toLowerCase().includes(searchLower)

            if (!matchesSearch) return false
          }

          // Date range filter
          if (filters.dateRange.start && task.dueDate) {
            if (new Date(task.dueDate) < new Date(filters.dateRange.start)) {
              return false
            }
          }

          if (filters.dateRange.end && task.dueDate) {
            if (new Date(task.dueDate) > new Date(filters.dateRange.end)) {
              return false
            }
          }

          // Active status filter
          if (filters.isActive !== undefined && task.isActive !== filters.isActive) {
            return false
          }

          return true
        })
      }

      return tasks
    } catch (error) {
      console.error("Error fetching tasks:", error)
      throw new Error("Failed to fetch tasks")
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<TaskStatistics> {
    try {
      const { getTaskStatistics } = await import("@/lib/actions/inspector/tasks")
      return await getTaskStatistics()
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      throw new Error("Failed to fetch dashboard statistics")
    }
  },

  // Get today's tasks
  async getTodaysTasks(): Promise<InspectorsTask[]> {
    try {
      const { getTodaysTasks } = await import("@/lib/actions/inspector/tasks")
      const tasks = await getTodaysTasks()

      // Transform the data to match our interface
      return tasks.map((task) => ({
        id: task.id,
        title: task.description,
        description: task.description,
        startDate: task.startDate,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        notes: null,
        productionOrderId: "",
        workCenterId: "",
        workCenterName: task.workCenterName,
        quantity: task.quantity,
        productionStatus: task.status,
        isActive: true,
      }))
    } catch (error) {
      console.error("Error fetching today's tasks:", error)
      throw new Error("Failed to fetch today's tasks")
    }
  },

  // Update task status
  async updateTaskStatus(data: { id: string; status: any; notes?: string; timeSpent?: number }): Promise<boolean> {
    try {
      const { updateTaskStatus } = await import("@/lib/actions/inspector/tasks")
      const result = await updateTaskStatus(data)
      return result.success
    } catch (error) {
      console.error("Error updating task status:", error)
      throw new Error("Failed to update task status")
    }
  },

  // Start task timer
  async startTaskTimer(taskId: string): Promise<boolean> {
    try {
      const { startTaskTimer } = await import("@/lib/actions/inspector/tasks")
      await startTaskTimer(taskId)
      return true
    } catch (error) {
      console.error("Error starting task timer:", error)
      throw new Error("Failed to start task timer")
    }
  },

  // Stop task timer
  async stopTaskTimer(taskId: string): Promise<boolean> {
    try {
      const { stopTaskTimer } = await import("@/lib/actions/inspector/tasks")
      await stopTaskTimer(taskId)
      return true
    } catch (error) {
      console.error("Error stopping task timer:", error)
      throw new Error("Failed to stop task timer")
    }
  },

  // Report task issue
  async reportTaskIssue(
    taskId: string,
    issueType: "QUALITY" | "MATERIAL" | "EQUIPMENT" | "OTHER",
    description: string,
    severity: "LOW" | "MEDIUM" | "HIGH",
  ): Promise<boolean> {
    try {
      const { reportTaskIssue } = await import("@/lib/actions/inspector/tasks")
      await reportTaskIssue(taskId, issueType, description, severity)
      return true
    } catch (error) {
      console.error("Error reporting task issue:", error)
      throw new Error("Failed to report task issue")
    }
  },

  // Create quality check (simulated - you'll need to implement this server action)
  async createQualityCheck(data: UpdateFormData): Promise<QualityCheck> {
    try {
      // This would call a server action to create a quality check record
      // For now, we'll simulate the response
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newQualityCheck: QualityCheck = {
        id: `qc-${Date.now()}`,
        taskId: data.taskId,
        inspectorId: "current-inspector-id",
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

      return newQualityCheck
    } catch (error) {
      console.error("Error creating quality check:", error)
      throw new Error("Failed to create quality check")
    }
  },

  // Get unique work centers for filtering
  async getWorkCenters(): Promise<string[]> {
    try {
      const tasks = await this.getTasks()
      const workCenters = [...new Set(tasks.map((task) => task.workCenterName))]
       return workCenters.sort()
    } catch (error) {
      console.error("Error fetching work centers:", error)
      return []
    }
  },
}
