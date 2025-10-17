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
  getProductionHistoryLogs,
  getProductionChangeTypes,
  exportProductionHistoryCSV,
} from "@/lib/actions/superadmin/audit-logs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"

export default function ProductionHistoryTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [changeTypes, setChangeTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  // Filters
  const [changeTypeFilter, setChangeTypeFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [productionOrderId, setProductionOrderId] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50

  useEffect(() => {
    loadChangeTypes()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [currentPage, changeTypeFilter, fromDate, toDate, productionOrderId])

  async function loadChangeTypes() {
    try {
      const types = await getProductionChangeTypes()
      setChangeTypes(types)
    } catch (error) {
      console.error("Error loading change types:", error)
    }
  }

  async function loadLogs() {
    try {
      setLoading(true)
      const filters: any = {}

      if (changeTypeFilter) filters.changeType = changeTypeFilter
      if (productionOrderId) filters.productionOrderId = productionOrderId
      if (fromDate) filters.fromDate = new Date(fromDate)
      if (toDate) filters.toDate = new Date(toDate)

      const result = await getProductionHistoryLogs(filters, currentPage, pageSize)
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

      if (changeTypeFilter) filters.changeType = changeTypeFilter
      if (productionOrderId) filters.productionOrderId = productionOrderId
      if (fromDate) filters.fromDate = new Date(fromDate)
      if (toDate) filters.toDate = new Date(toDate)

      const csvData = await exportProductionHistoryCSV(filters)

      // Download CSV
      const blob = new Blob([csvData], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `production-history-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`
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
    setChangeTypeFilter("")
    setFromDate("")
    setToDate("")
    setProductionOrderId("")
    setCurrentPage(1)
  }

  function getStatusBadgeVariant(status: string | null) {
    if (!status) return "secondary"
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "secondary"
      case "PENDING":
        return "outline"
      case "ON_HOLD":
        return "destructive"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Production Order History</CardTitle>
          <CardDescription>
            Complete audit trail of production order changes and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="changeType">Change Type</Label>
              <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
                <SelectTrigger id="changeType">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {changeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productionOrderId">Production Order ID</Label>
              <Input
                id="productionOrderId"
                placeholder="Enter order ID"
                value={productionOrderId}
                onChange={(e) => setProductionOrderId(e.target.value)}
              />
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
                  <TableHead>Product</TableHead>
                  <TableHead>Change Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/superadmin/production/${log.productionOrderId}`}
                            className="font-medium hover:underline"
                          >
                            {log.productionOrder.product.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            SKU: {log.productionOrder.product.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.changeType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(log.status) as any}>
                          {log.status || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{log.user.email}</div>
                          {log.user.profile && (
                            <div className="text-xs text-muted-foreground">
                              {log.user.profile.firstName} {log.user.profile.lastName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.timestamp), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), "HH:mm:ss")}
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
            <DialogTitle>Production History Details</DialogTitle>
            <DialogDescription>
              Complete information about this production change
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Product</Label>
                  <div className="mt-1 text-sm font-medium">
                    {selectedLog.productionOrder.product.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SKU: {selectedLog.productionOrder.product.sku}
                  </div>
                </div>
                <div>
                  <Label>Production Order</Label>
                  <div className="mt-1">
                    <Link
                      href={`/superadmin/production/${selectedLog.productionOrderId}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Order Details
                    </Link>
                  </div>
                </div>
                <div>
                  <Label>Change Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedLog.changeType}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedLog.status) as any}>
                      {selectedLog.status || "N/A"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>User</Label>
                  <div className="mt-1 text-sm">{selectedLog.user.email}</div>
                  {selectedLog.user.profile && (
                    <div className="text-xs text-muted-foreground">
                      {selectedLog.user.profile.firstName} {selectedLog.user.profile.lastName}
                    </div>
                  )}
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
                    {format(new Date(selectedLog.timestamp), "MMM dd, yyyy HH:mm:ss")}
                  </div>
                </div>
                <div>
                  <Label>Order Quantity</Label>
                  <div className="mt-1 text-sm">
                    {selectedLog.productionOrder.quantity} units
                  </div>
                </div>
              </div>

              {selectedLog.notes && (
                <div>
                  <Label>Notes</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg text-sm">
                    {selectedLog.notes}
                  </div>
                </div>
              )}

              <div>
                <Label>Log ID</Label>
                <div className="mt-1 text-xs font-mono text-muted-foreground">
                  {selectedLog.id}
                </div>
              </div>

              <div>
                <Label>Production Order ID</Label>
                <div className="mt-1 text-xs font-mono text-muted-foreground">
                  {selectedLog.productionOrderId}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
