"use client"

import { useState, useEffect, useCallback } from "react"
import { inspectorClientApi } from "@/lib/api/inspector-client-api"
import { FilterOptions, UpdateFormData } from "@/types/inspector/inspector"
import { InspectorsTask } from "@/types/inspector/task"
import { TaskStatistics } from "@/types/worker"
import { QualityCheck } from "@prisma/client"


export function useInspectorData() {
  const [tasks, setTasks] = useState<InspectorsTask[]>([])
  const [todaysTasks, setTodaysTasks] = useState<InspectorsTask[]>([])
  const [dashboardStats, setDashboardStats] = useState<TaskStatistics | null>(null)
  const [workCenters, setWorkCenters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all tasks with filters
  const fetchTasks = useCallback(async (filters?: FilterOptions) => {
    try {
      setLoading(true)
      setError(null)
      const fetchedTasks = await inspectorClientApi.getTasks(filters)
      setTasks(fetchedTasks)
    } catch (err) {
      setError("Failed to fetch tasks")
      console.error("Error fetching tasks:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch today's tasks
  const fetchTodaysTasks = useCallback(async () => {
    try {
      const fetchedTasks = await inspectorClientApi.getTodaysTasks()
      setTodaysTasks(fetchedTasks)
    } catch (err) {
      console.error("Error fetching today's tasks:", err)
    }
  }, [])

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      const stats = await inspectorClientApi.getDashboardStats()
      setDashboardStats(stats)
    } catch (err) {
      console.error("Error fetching dashboard stats:", err)
    }
  }, [])

  // Fetch work centers for filtering
  const fetchWorkCenters = useCallback(async () => {
    try {
      const centers = await inspectorClientApi.getWorkCenters()
      setWorkCenters(centers)
    } catch (err) {
      console.error("Error fetching work centers:", err)
    }
  }, [])

  // Update task status
  const updateTaskStatus = useCallback(
    async (taskId: string, status: any, notes?: string, timeSpent?: number): Promise<boolean> => {
      try {
        const success = await inspectorClientApi.updateTaskStatus({
          id: taskId,
          status,
          notes,
          timeSpent,
        })

        if (success) {
          // Update local state
          setTasks((prev) =>
            prev.map((task) => (task.id === taskId ? { ...task, status, notes: notes || task.notes } : task)),
          )

          // Refresh stats and today's tasks
          fetchDashboardStats()
          fetchTodaysTasks()
        }

        return success
      } catch (err) {
        setError("Failed to update task status")
        console.error("Error updating task status:", err)
        return false
      }
    },
    [fetchDashboardStats, fetchTodaysTasks],
  )

  // Start task timer
  const startTaskTimer = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        const success = await inspectorClientApi.startTaskTimer(taskId)

        if (success) {
          // Update local state to IN_PROGRESS if it was PENDING
          setTasks((prev) =>
            prev.map((task) =>
              task.id === taskId && task.status === "PENDING" ? { ...task, status: "IN_PROGRESS" as any } : task,
            ),
          )

          // Refresh data
          fetchDashboardStats()
          fetchTodaysTasks()
        }

        return success
      } catch (err) {
        setError("Failed to start task timer")
        console.error("Error starting task timer:", err)
        return false
      }
    },
    [fetchDashboardStats, fetchTodaysTasks],
  )

  // Stop task timer
  const stopTaskTimer = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        const success = await inspectorClientApi.stopTaskTimer(taskId)

        if (success) {
          // Refresh data
          fetchDashboardStats()
          fetchTodaysTasks()
        }

        return success
      } catch (err) {
        setError("Failed to stop task timer")
        console.error("Error stopping task timer:", err)
        return false
      }
    },
    [fetchDashboardStats, fetchTodaysTasks],
  )

  // Report task issue
  const reportTaskIssue = useCallback(
    async (
      taskId: string,
      issueType: "QUALITY" | "MATERIAL" | "EQUIPMENT" | "OTHER",
      description: string,
      severity: "LOW" | "MEDIUM" | "HIGH",
    ): Promise<boolean> => {
      try {
        const success = await inspectorClientApi.reportTaskIssue(taskId, issueType, description, severity)

        if (success) {
          // Refresh tasks to show updated notes
          fetchTasks()
        }

        return success
      } catch (err) {
        setError("Failed to report task issue")
        console.error("Error reporting task issue:", err)
        return false
      }
    },
    [fetchTasks],
  )

  // Create quality check
  const createQualityCheck = useCallback(
    async (data: UpdateFormData): Promise<QualityCheck | null> => {
      try {
        const newCheck = await inspectorClientApi.createQualityCheck(data)

        // Refresh data
        fetchTasks()
        fetchDashboardStats()

        return newCheck
      } catch (err) {
        setError("Failed to create quality check")
        console.error("Error creating quality check:", err)
        return null
      }
    },
    [fetchTasks, fetchDashboardStats],
  )

  // Initial data fetch
  useEffect(() => {
    fetchTasks()
    fetchTodaysTasks()
    fetchDashboardStats()
    fetchWorkCenters()
  }, [fetchTasks, fetchTodaysTasks, fetchDashboardStats, fetchWorkCenters])

  return {
    tasks,
    todaysTasks,
    dashboardStats,
    workCenters,
    loading,
    error,
    fetchTasks,
    fetchTodaysTasks,
    fetchDashboardStats,
    updateTaskStatus,
    startTaskTimer,
    stopTaskTimer,
    reportTaskIssue,
    createQualityCheck,
  }
}
