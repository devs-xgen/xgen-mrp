"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { LoginActivity, UsersByRole } from "@/lib/actions/superadmin/analytics/user";
import { Users, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserActivityAnalyticsProps {
  loginActivity: LoginActivity[];
  usersByRole: UsersByRole[];
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "#dc2626", // red
  ADMIN: "#f59e0b", // amber
  WORKER: "#3b82f6", // blue
  INSPECTOR: "#10b981", // green
  DELIVERY: "#8b5cf6", // violet
  DEVELOPER: "#ec4899", // pink
};

export function UserActivityAnalytics({
  loginActivity,
  usersByRole,
}: UserActivityAnalyticsProps) {
  // Calculate totals
  const totalUsers = usersByRole.reduce((sum, role) => sum + role.count, 0);
  const totalActive = usersByRole.reduce((sum, role) => sum + role.active, 0);
  const totalInactive = usersByRole.reduce((sum, role) => sum + role.inactive, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalActive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalUsers > 0 ? Math.round((totalActive / totalUsers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-600" />
              Inactive Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalInactive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalUsers > 0 ? Math.round((totalInactive / totalUsers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Login Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Login Activity Over Time</CardTitle>
          <CardDescription>Daily login counts and unique users</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={loginActivity}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-2">
                        {format(new Date(payload[0].payload.date), "MMM dd, yyyy")}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>Total Logins: {payload[0].value}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>Unique Users: {payload[0].payload.uniqueUsers}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="loginCount"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Total Logins"
                dot={{ fill: "#3b82f6" }}
              />
              <Line
                type="monotone"
                dataKey="uniqueUsers"
                stroke="#10b981"
                strokeWidth={2}
                name="Unique Users"
                dot={{ fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Users by Role */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>Active vs inactive breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usersByRole}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="role" className="text-xs" angle={-45} textAnchor="end" height={80} />
                <YAxis className="text-xs" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="text-sm font-medium mb-2">{data.role}</p>
                        <div className="space-y-1 text-sm">
                          <p>Total: {data.count}</p>
                          <p className="text-green-600">Active: {data.active}</p>
                          <p className="text-red-600">Inactive: {data.inactive}</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="active" stackId="a" fill="#10b981" name="Active" />
                <Bar dataKey="inactive" stackId="a" fill="#ef4444" name="Inactive" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>User count by role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usersByRole}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ role, count }) => `${role}: ${count}`}
                >
                  {usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.role] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Role Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Role Activity Summary</CardTitle>
          <CardDescription>Detailed breakdown by role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usersByRole.map((role) => {
              const activePercentage = role.count > 0 ? Math.round((role.active / role.count) * 100) : 0;
              return (
                <div
                  key={role.role}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ROLE_COLORS[role.role] || "#6b7280" }}
                    />
                    <div>
                      <p className="font-medium">{role.role}</p>
                      <p className="text-xs text-muted-foreground">
                        {role.count} total users
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{role.active} active</p>
                      <p className="text-xs text-muted-foreground">{activePercentage}% active rate</p>
                    </div>
                    <Badge
                      variant={activePercentage >= 80 ? "default" : activePercentage >= 50 ? "secondary" : "destructive"}
                    >
                      {activePercentage}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
