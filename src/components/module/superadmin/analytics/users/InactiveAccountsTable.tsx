"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InactiveAccount } from "@/lib/actions/superadmin/analytics/user";
import { AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface InactiveAccountsTableProps {
  accounts: InactiveAccount[];
}

export function InactiveAccountsTable({ accounts }: InactiveAccountsTableProps) {
  const getSeverityBadge = (days: number | null) => {
    if (days === null) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Never Logged In
        </Badge>
      );
    }
    if (days >= 90) {
      return <Badge variant="destructive">90+ days</Badge>;
    }
    if (days >= 60) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">60+ days</Badge>;
    }
    return <Badge variant="outline">30+ days</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Summary Alert */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Inactive Accounts Detected
          </CardTitle>
          <CardDescription className="text-amber-800 dark:text-amber-200">
            {accounts.length} user accounts have not logged in for 30+ days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
              <p className="text-sm font-medium mb-1">Never Logged In</p>
              <p className="text-2xl font-bold text-red-600">
                {accounts.filter((a) => a.daysSinceLogin === null).length}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
              <p className="text-sm font-medium mb-1">90+ Days Inactive</p>
              <p className="text-2xl font-bold text-orange-600">
                {accounts.filter((a) => a.daysSinceLogin !== null && a.daysSinceLogin >= 90).length}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
              <p className="text-sm font-medium mb-1">30-89 Days Inactive</p>
              <p className="text-2xl font-bold text-amber-600">
                {accounts.filter((a) => a.daysSinceLogin !== null && a.daysSinceLogin >= 30 && a.daysSinceLogin < 90).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inactive Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inactive User Accounts</CardTitle>
          <CardDescription>
            Users with no login activity in the last 30+ days (Top 100 shown)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Days Inactive</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length > 0 ? (
                  accounts.map((account) => (
                    <TableRow key={account.userId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{account.name}</div>
                          <div className="text-xs text-muted-foreground">{account.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{account.tenantName || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        {account.lastLoginAt ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(account.lastLoginAt), "MMM dd, yyyy")}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {account.daysSinceLogin !== null ? `${account.daysSinceLogin} days` : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>{getSeverityBadge(account.daysSinceLogin)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No inactive accounts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
