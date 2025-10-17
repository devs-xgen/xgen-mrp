"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Search, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { format } from "date-fns"
import {
  getActivityLogs,
  getActivityLogTypes,
  exportActivityLogsCSV,
} from "@/lib/actions/superadmin/audit-logs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ActivityLogsTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [logTypes, setLogTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  // Filters
  const [typeFilter, setTypeFilter] = useState("")
  const [searchFilter, setSearchFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50

  useEffect(() => {
    loadLogTypes()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [currentPage, typeFilter, fromDate, toDate])

  async function loadLogTypes() {
    try {
      const types = await getActivityLogTypes()
      setLogTypes(types)
    } catch (error) {
      console.error("Error loading log types:", error)
    }
  }

  async function loadLogs() {
    try {
      setLoading(true)
      const filters: any = {}

      if (typeFilter) filters.type = typeFilter
      if (fromDate) filters.fromDate = new Date(fromDate)
      if (toDate) filters.toDate = new Date(toDate)

      const result = await getActivityLogs(filters, currentPage, pageSize)
      setLogs(result.logs)
      setTotalPages(result.pagination.totalPages)
      setTotal(result.pagination.total)
    } catch (error) {
      console.error("Error loading logs:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      setExporting(true)
      const filters: any = {}

      if (typeFilter) filters.type = typeFilter
      if (fromDate) filters.fromDate = new Date(fromDate)
      if (toDate) filters.toDate = new Date(toDate)

      const csvData = await exportActivityLogsCSV(filters)

      // Download CSV
      const blob = new Blob([csvData], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting logs:", error)
    } finally {
      setExporting(false)
    }
  }

  function handleSearch() {
    setCurrentPage(1)
    loadLogs()
  }

  function clearFilters() {
    setTypeFilter("")
    setSearchFilter("")
    setFromDate("")
    setToDate("")
    setCurrentPage(1)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            System-wide activity tracking across all users and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="type">Activity Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {logTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {logs.length} of {total.toLocaleString()} logs
            </div>
            <Button onClick={handleExport} disabled={exporting} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user.email}</div>
                          {log.user.profile && (
                            <div className="text-xs text-muted-foreground">
                              {log.user.profile.firstName} {log.user.profile.lastName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.createdAt), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.createdAt), "HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this activity
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Activity Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedLog.type}</Badge>
                  </div>
                </div>
                <div>
                  <Label>User</Label>
                  <div className="mt-1 text-sm">{selectedLog.user.email}</div>
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{selectedLog.user.role}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedLog.createdAt), "MMM dd, yyyy HH:mm:ss")}
                  </div>
                </div>
              </div>

              <div>
                <Label>Details</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <Label>Log ID</Label>
                <div className="mt-1 text-xs font-mono text-muted-foreground">
                  {selectedLog.id}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
