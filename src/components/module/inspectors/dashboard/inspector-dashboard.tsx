"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskUpdateForm } from "./task-update-form"
import { NotificationContainer } from "./notification-container"
import {
  ClipboardCheck,
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
import { useInspectorData } from "@/hooks/use-inspector-data"
import { useNotifications } from "@/hooks/use-notification"
import { FilterOptions, UpdateFormData } from "@/types/inspector/inspector"

export function InspectorDashboard() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [filters, setFilters] = useState<FilterOptions>({
    status: "ALL",
    priority: "ALL",
    workCenter: "ALL",
    dateRange: {},
    searchTerm: "",
  })

  const {
    tasks,
    todaysTasks,
    dashboardStats,
    workCenters,
    loading,
    error,
    fetchTasks,
    updateTaskStatus,
    startTaskTimer,
    stopTaskTimer,
    reportTaskIssue,
    createQualityCheck,
  } = useInspectorData()

  const { notifications, showSuccess, showError, showInfo, hideNotification } = useNotifications()

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: keyof FilterOptions, value: any) => {
      const newFilters = { ...filters, [key]: value }
      setFilters(newFilters)
      fetchTasks(newFilters)
    },
    [filters, fetchTasks],
  )

  // Handle quality check form submission
  const handleQualityCheckSubmit = useCallback(
    async (data: UpdateFormData) => {
      showInfo("Processing Quality Check", "Your quality check update is being processed...")

      const result = await createQualityCheck(data)

      if (result) {
        showSuccess("Quality Check Added", `Quality check for task ${data.taskId} has been recorded.`)
        setShowUpdateForm(false)
        setSelectedTask(null)
      } else {
        showError("Update Failed", "Failed to save the quality check. Please try again.")
      }
    },
    [createQualityCheck, showSuccess, showError, showInfo],
  )

  // Handle task status updates
  const handleStatusUpdate = useCallback(
    async (taskId: string, newStatus: Status, notes?: string) => {
      showInfo("Updating Status", "Updating task status...")

      const success = await updateTaskStatus(taskId, newStatus, notes)

      if (success) {
        showSuccess("Status Updated", `Task status updated to ${newStatus}`)
      } else {
        showError("Update Failed", "Failed to update task status")
      }
    },
    [updateTaskStatus, showSuccess, showError, showInfo],
  )

  // Handle timer actions
  const handleStartTimer = useCallback(
    async (taskId: string) => {
      showInfo("Starting Timer", "Starting task timer...")

      const success = await startTaskTimer(taskId)

      if (success) {
        showSuccess("Timer Started", "Task timer has been started")
      } else {
        showError("Timer Failed", "Failed to start task timer")
      }
    },
    [startTaskTimer, showSuccess, showError, showInfo],
  )

  const handleStopTimer = useCallback(
    async (taskId: string) => {
      showInfo("Stopping Timer", "Stopping task timer...")

      const success = await stopTaskTimer(taskId)

      if (success) {
        showSuccess("Timer Stopped", "Task timer has been stopped")
      } else {
        showError("Timer Failed", "Failed to stop task timer")
      }
    },
    [stopTaskTimer, showSuccess, showError, showInfo],
  )

  // Handle issue reporting
  const handleReportIssue = useCallback(
    async (
      taskId: string,
      issueType: "QUALITY" | "MATERIAL" | "EQUIPMENT" | "OTHER",
      description: string,
      severity: "LOW" | "MEDIUM" | "HIGH",
    ) => {
      showInfo("Reporting Issue", "Reporting task issue...")

      const success = await reportTaskIssue(taskId, issueType, description, severity)

      if (success) {
        showSuccess("Issue Reported", "Task issue has been reported successfully")
      } else {
        showError("Report Failed", "Failed to report task issue")
      }
    },
    [reportTaskIssue, showSuccess, showError, showInfo],
  )

  // Refresh data
  const handleRefresh = useCallback(() => {
    showInfo("Refreshing Data", "Updating dashboard data...")
    fetchTasks(filters)
  }, [fetchTasks, filters, showInfo])

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.COMPLETED:
        return "bg-green-100 text-green-800"
      case Status.IN_PROGRESS:
        return "bg-blue-100 text-blue-800"
      case Status.PENDING:
        return "bg-yellow-100 text-yellow-800"
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
        return "bg-orange-100 text-orange-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspector Dashboard</h1>
          <p className="text-gray-600">Your work overview and assigned tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="production">All Production</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          {dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Not Started</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.pending}</div>
                  <p className="text-xs text-muted-foreground">Tasks pending to be started</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.inProgress}</div>
                  <p className="text-xs text-muted-foreground">Tasks currently being worked on</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.completed}</div>
                  <p className="text-xs text-muted-foreground">Tasks completed today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.urgentTasks}</div>
                  <p className="text-xs text-muted-foreground">High priority tasks requiring attention</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Daily Progress Tracker */}
          {dashboardStats && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="text-sm font-medium">{dashboardStats.completionRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={dashboardStats.completionRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {dashboardStats.completed} of {dashboardStats.total} tasks completed today
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Tasks Breakdown</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Not Started:</span>
                          <span>{dashboardStats.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>In Progress:</span>
                          <span>{dashboardStats.inProgress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span>{dashboardStats.completed}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Priority Distribution</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {dashboardStats.urgentTasks} Urgent
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {dashboardStats.inProgress} Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Tasks</CardTitle>
              <CardDescription>Tasks scheduled for today</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading today's tasks...</p>
                </div>
              ) : todaysTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No tasks scheduled for today</div>
              ) : (
                <div className="space-y-4">
                  {todaysTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between border-b pb-4 ${
                        task.priority === "URGENT" ? "bg-red-50 p-3 rounded-md border-red-200" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{task.description}</h3>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{task.workCenterName}</span>
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
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        <div className="flex gap-1">
                          {task.status === Status.PENDING && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartTimer(task.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {task.status === Status.IN_PROGRESS && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStopTimer(task.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTask(task.id)
                              setShowUpdateForm(true)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <select
              value={filters.workCenter}
              onChange={(e) => handleFilterChange("workCenter", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Work Centers</option>
              {workCenters.map((center) => (
                <option key={center} value={center}>
                  {center}
                </option>
              ))}
            </select>
          </div>

          {/* Tasks List */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{task.description}</CardTitle>
                        <CardDescription>Work Center: {task.workCenterName}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        {!task.isActive && <Badge variant="outline">Inactive</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-semibold">{task.quantity} units</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Start Date</p>
                        <p className="font-semibold">
                          {task.startDate ? new Date(task.startDate).toLocaleDateString() : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="font-semibold">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}
                        </p>
                      </div>
                    </div>

                    {task.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium mb-1">Notes:</p>
                        <p className="text-sm text-gray-700">{task.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {task.status === Status.PENDING && task.isActive && (
                        <Button
                          variant="outline"
                          onClick={() => handleStartTimer(task.id)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      )}
                      {task.status === Status.IN_PROGRESS && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleStopTimer(task.id)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleStatusUpdate(task.id, Status.COMPLETED)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedTask(task.id)
                          setShowUpdateForm(true)
                        }}
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Quality Check
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleReportIssue(task.id, "OTHER", "Issue reported from dashboard", "MEDIUM")}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Report Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Production Tasks</CardTitle>
              <CardDescription>Overview of all production tasks across work centers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This section would show all production tasks across the facility. You can implement this by calling
                getProductionTasks() and displaying the results.
              </p>
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
                    <span className="font-semibold">
                      {dashboardStats ? `${dashboardStats.completionRate.toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Tasks</span>
                    <span className="font-semibold">{dashboardStats?.activeTasks || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inactive Tasks</span>
                    <span className="font-semibold">{dashboardStats?.inactiveTasks || 0}</span>
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
                    <span className="font-semibold">{dashboardStats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgent Priority</span>
                    <span className="font-semibold text-red-600">{dashboardStats?.urgentTasks || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work Centers</span>
                    <span className="font-semibold">{workCenters.length}</span>
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
