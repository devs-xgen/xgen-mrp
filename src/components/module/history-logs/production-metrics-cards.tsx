"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, Package, Users, BarChart3 } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease"
  description?: string
  icon: React.ElementType
  color?: "default" | "success" | "warning" | "error"
}

function MetricCard({ title, value, change, changeType, description, icon: Icon, color = "default" }: MetricCardProps) {
  const colorClasses = {
    default: "text-primary",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {changeType === "increase" ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={changeType === "increase" ? "text-green-600" : "text-red-600"}>{Math.abs(change)}%</span>
            <span>from last period</span>
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

export default function ProductionMetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Production Orders"
        value="24"
        change={12}
        changeType="increase"
        description="Active production orders"
        icon={Package}
        color="default"
      />

      <MetricCard
        title="Completed Operations"
        value="156"
        change={8}
        changeType="increase"
        description="Operations completed today"
        icon={CheckCircle}
        color="success"
      />

      <MetricCard
        title="Quality Pass Rate"
        value="98.5%"
        change={2.1}
        changeType="increase"
        description="Quality inspections passed"
        icon={BarChart3}
        color="success"
      />

      <MetricCard
        title="Average Efficiency"
        value="94.2%"
        change={1.5}
        changeType="decrease"
        description="Overall operation efficiency"
        icon={TrendingUp}
        color="warning"
      />

      <MetricCard
        title="Active Workers"
        value="32"
        description="Workers currently assigned"
        icon={Users}
        color="default"
      />

      <MetricCard
        title="Pending Quality Checks"
        value="7"
        description="Awaiting inspection"
        icon={AlertTriangle}
        color="warning"
      />

      <MetricCard
        title="Material Consumption"
        value="$2,450"
        change={5.3}
        changeType="increase"
        description="Today's material costs"
        icon={Package}
        color="default"
      />

      <MetricCard
        title="Average Cycle Time"
        value="2.4h"
        change={10}
        changeType="decrease"
        description="Per operation cycle time"
        icon={Clock}
        color="success"
      />
    </div>
  )
}
