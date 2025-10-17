"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, FileText, TrendingUp } from "lucide-react"
import ActivityLogsTab from "./activity-logs-tab"
import ProductionHistoryTab from "./production-history-tab"

interface AuditLogsClientProps {
  stats: {
    totalActivityLogs: number
    totalProductionLogs: number
    activityLogsToday: number
    productionLogsToday: number
    activityLogsByType: Array<{ type: string; count: number }>
    topUsers: Array<{
      userId: string
      count: number
      user: {
        id: string
        email: string
        role: string
        profile: {
          firstName: string
          lastName: string
        } | null
      } | null
    }>
  }
}

export default function AuditLogsClient({ stats }: AuditLogsClientProps) {
  const [activeTab, setActiveTab] = useState("activity")

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Complete audit trail of system activities and production changes
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activity Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivityLogs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activityLogsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production History</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProductionLogs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.productionLogsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Activity Type</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activityLogsByType[0]?.type || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activityLogsByType[0]?.count || 0} occurrences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active User</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">
              {stats.topUsers[0]?.user?.email || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.topUsers[0]?.count || 0} activities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="production">
            <FileText className="h-4 w-4 mr-2" />
            Production History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <ActivityLogsTab />
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <ProductionHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
