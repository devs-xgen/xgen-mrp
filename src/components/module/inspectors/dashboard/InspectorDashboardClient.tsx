"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  RefreshCw,
  Play,
  Pause,
  Flag,
} from "lucide-react"
import { Status } from "@prisma/client"
import Link from "next/link"
import { useNotifications } from "@/hooks/use-notification"
import type { UpdateFormData } from "@/types/inspector/inspector"
import type { TaskStatistics } from "@/types/worker"
import { TaskUpdateForm } from "../task-update-form"
import { NotificationContainer } from "./notification-container"

// Using the InspectorsTask interface
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

interface InspectorDashboardClientProps {
  initialInspectorTasks: InspectorsTask[]
  initialStats: TaskStatistics
}

export function InspectorDashboardClient({ initialInspectorTasks, initialStats }: InspectorDashboardClientProps) {
  const [inspectorTasks, setInspectorTasks] = useState<InspectorsTask[]>(initialInspectorTasks)
  const [stats, setStats] = useState<TaskStatistics>(initialStats)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { notifications, showSuccess, showError, showInfo, hideNotification } = useNotifications()

  // Filter inspector tasks based on search
  const filteredInspectorTasks = inspectorTasks.filter(
    (task) =>
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.workCenterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.title && task.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      task.productionOrderId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Refresh data function
  const refreshData = useCallback(async () => {
    setLoading(true)
    showInfo("Refreshing Data", "Updating dashboard data...")
    try {
      // Dynamic import to avoid SSR issues
      const { getInspectorTasks, getTaskStatistics } = await import("@/lib/actions/inspector/tasks")
      const [newInspectorTasks, newStats] = await Promise.all([getInspectorTasks(), getTaskStatistics()])
      setInspectorTasks(newInspectorTasks)
      setStats(newStats)
      showSuccess("Data Refreshed", "Dashboard data has been updated")
    } catch (error) {
      console.error("Error refreshing data:", error)
      showError("Refresh Failed", "Failed to refresh dashboard data")
    } finally {
      setLoading(false)
    }
  }, [showSuccess, showError, showInfo])

  // Handle task status updates
  const handleTaskStatusUpdate = useCallback(
    async (taskId: string, newStatus: Status, notes?: string) => {
      showInfo("Updating Status", "Updating task status...")
      try {
        const { updateTaskStatus } = await import("@/lib/actions/inspector/tasks")
        const result = await updateTaskStatus({
          id: taskId,
          status: newStatus,
          notes,
        })
        if (result.success) {
          showSuccess("Status Updated", `Task status updated to ${newStatus}`)
          // Refresh data to get latest state
          refreshData()
        } else {
          showError("Update Failed", "Failed to update task status")
        }
      } catch (error) {
        console.error("Error updating task status:", error)
        showError("Update Failed", "Failed to update task status")
      }
    },
    [showSuccess, showError, showInfo, refreshData],
  )

  // Handle timer actions
  const handleStartTimer = useCallback(
    async (taskId: string) => {
      showInfo("Starting Timer", "Starting task timer...")
      try {
        const { startTaskTimer } = await import("@/lib/actions/inspector/tasks")
        await startTaskTimer(taskId)
        showSuccess("Timer Started", "Task timer has been started")
        refreshData()
      } catch (error) {
        console.error("Error starting timer:", error)
        showError("Timer Failed", "Failed to start task timer")
      }
    },
    [showSuccess, showError, showInfo, refreshData],
  )

  const handleStopTimer = useCallback(
    async (taskId: string) => {
      showInfo("Stopping Timer", "Stopping task timer...")
      try {
        const { stopTaskTimer } = await import("@/lib/actions/inspector/tasks")
        await stopTaskTimer(taskId)
        showSuccess("Timer Stopped", "Task timer has been stopped")
        refreshData()
      } catch (error) {
        console.error("Error stopping timer:", error)
        showError("Timer Failed", "Failed to stop task timer")
      }
    },
    [showSuccess, showError, showInfo, refreshData],
  )

  // Handle quality check form submission
  const handleQualityCheckSubmit = useCallback(
    async (data: UpdateFormData) => {
      showInfo("Processing Quality Check", "Your quality check update is being processed...")
      try {
        // Simulate quality check creation (you can implement this server action)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        showSuccess("Quality Check Added", `Quality check for task ${data.taskId} has been recorded.`)
        setShowUpdateForm(false)
        setSelectedTask(null)
        refreshData()
      } catch (error) {
        console.error("Error creating quality check:", error)
        showError("Update Failed", "Failed to save the quality check. Please try again.")
      }
    },
    [showSuccess, showError, showInfo, refreshData],
  )

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.COMPLETED:
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case Status.IN_PROGRESS:
        return "bg-amber-100 text-amber-800 hover:bg-amber-100"
      case Status.PENDING:
        return "bg-gray-100 text-gray-800"
      case Status.CANCELLED:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspector Dashboard</h1>
          <p className="text-gray-600">Your work overview and assigned tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowUpdateForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Quality Check
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Inspector Tasks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Not Started</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Tasks pending to be started</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">Tasks currently being worked on</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Tasks completed today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.urgentTasks}</div>
                <p className="text-xs text-muted-foreground">High priority tasks requiring attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Progress Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-medium">{stats.completionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.completionRate} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.completed} of {stats.total} tasks completed today
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Tasks Breakdown</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Not Started:</span>
                        <span>{stats.pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In Progress:</span>
                        <span>{stats.inProgress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span>{stats.completed}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Priority Distribution</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.urgentTasks} Urgent
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {stats.inProgress} Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspector Tasks Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inspector Tasks Preview</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setActiveTab("tasks")}>
                <span>View All</span>
                <ClipboardList className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inspectorTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between border-b pb-4 ${
                      task.priority === "URGENT" ? "bg-red-50 p-3 rounded-md border-red-200" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{task.title || task.description}</h3>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        {!task.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{task.workCenterName}</span>
                        <span>•</span>
                        <span>Order: {task.productionOrderId}</span>
                        <span>•</span>
                        <span>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "No due time"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status === Status.PENDING && "Not Started"}
                        {task.status === Status.IN_PROGRESS && "In Progress"}
                        {task.status === Status.COMPLETED && "Completed"}
                      </Badge>
                      <Badge className={getStatusColor(task.productionStatus)} variant="outline">
                        Prod: {task.productionStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search inspector tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Inspector Tasks Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inspector Tasks</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link href="/inspector/tasks">
                  <span>View All Tasks</span>
                  <ClipboardList className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInspectorTasks.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchTerm ? "No tasks match your search" : "No inspector tasks available"}
                  </div>
                ) : (
                  filteredInspectorTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between border-b pb-4 ${
                        task.priority === "URGENT" ? "bg-red-50 p-3 rounded-md border-red-200" : ""
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{task.title || task.description}</h3>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          {!task.isActive && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{task.workCenterName}</span>
                          <span>•</span>
                          <span>Order: {task.productionOrderId}</span>
                          <span>•</span>
                          <span>
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "No due time"}
                          </span>
                          <span>•</span>
                          <span>{task.quantity} units</span>
                        </div>
                        {task.notes && <p className="text-xs text-muted-foreground mt-1 italic">Notes: {task.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status === Status.PENDING && "Not Started"}
                            {task.status === Status.IN_PROGRESS && "In Progress"}
                            {task.status === Status.COMPLETED && "Completed"}
                          </Badge>
                          <Badge
                            className={getStatusColor(task.productionStatus)}
                            variant="outline"
                            className="text-xs"
                          >
                            Prod: {task.productionStatus}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {task.status === Status.PENDING && task.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartTimer(task.id)}
                              className="h-8 w-8 p-0"
                              title="Start Task"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {task.status === Status.IN_PROGRESS && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStopTimer(task.id)}
                                className="h-8 w-8 p-0"
                                title="Pause Task"
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTaskStatusUpdate(task.id, Status.COMPLETED)}
                                className="h-8 w-8 p-0"
                                title="Complete Task"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTask(task.id)
                              setShowUpdateForm(true)
                            }}
                            className="h-8 w-8 p-0"
                            title="Add Quality Check"
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link href={`/inspector/tasks?id=${task.id}`}>
                              <Clock className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {filteredInspectorTasks.length > 0 && (
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link href="/inspector/tasks">View All Tasks</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-semibold">{stats.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Tasks</span>
                    <span className="font-semibold">{stats.activeTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inactive Tasks</span>
                    <span className="font-semibold">{stats.inactiveTasks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Work Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Tasks</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgent Priority</span>
                    <span className="font-semibold text-red-600">{stats.urgentTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inspector Tasks</span>
                    <span className="font-semibold">{inspectorTasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Tasks</span>
                    <span className="font-semibold text-green-600">
                      {inspectorTasks.filter((task) => task.isActive).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quality Check Form Modal */}
      {showUpdateForm && (
        <TaskUpdateForm
          taskId={selectedTask}
          onSubmit={handleQualityCheckSubmit}
          onClose={() => {
            setShowUpdateForm(false)
            setSelectedTask(null)
          }}
        />
      )}

      {/* Notification Container */}
      <NotificationContainer notifications={notifications} onHideNotification={hideNotification} />
    </div>
  )
}
