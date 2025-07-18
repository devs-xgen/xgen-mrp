"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { ActivityIcon, Clock, CalendarClock, User, ShoppingCart } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils" // Assuming this utility exists

// Helper function to render JSON details
const renderDetails = (details: any) => {
  if (!details) return "N/A"
  // If details is already a string (from the formattedLogs in getProductionLogs), return it directly
  if (typeof details === "string") {
    return details
  }
  return (
    <div className="text-xs text-muted-foreground max-w-[300px] truncate">
      {Object.entries(details).map(([key, value]) => (
        <div key={key}>
          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>{" "}
          {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}
        </div>
      ))}
    </div>
  )
}

// Helper function to get badge color
const getBadgeColor = (type: string) => {
  switch (type) {
    case "PRODUCTION_STATUS_CHANGE":
      return "bg-blue-500 hover:bg-blue-500/80"
    case "PRODUCT_STOCK_INCREMENT":
      return "bg-green-500 hover:bg-green-500/80"
    case "PRODUCTION_ORDER_DELETED":
      return "bg-red-500 hover:bg-red-500/80"
    case "MATERIAL_RELEASED":
      return "bg-orange-500 hover:bg-orange-500/80"
    case "PRODUCTION_ORDER_CREATED":
      return "bg-purple-500 hover:bg-purple-500/80"
    case "PRODUCTION_ORDER_UPDATED":
      return "bg-indigo-500 hover:bg-indigo-500/80"
    case "OPERATION_CREATED":
    case "OPERATION_DELETED":
    case "OPERATION_STATUS_CHANGE":
      return "bg-cyan-500 hover:bg-cyan-500/80"
    case "CUSTOMER_ORDER_LINKED":
      return "bg-teal-500 hover:bg-teal-500/80"
    case "PRODUCTION_STARTED":
      return "bg-lime-600 hover:bg-lime-600/80"
    case "ADMIN_WORKFLOW_OVERRIDE":
    case "SECURITY_ADMIN_ACTION":
      return "bg-rose-700 hover:bg-rose-700/80"
    case "PRODUCTION_BOM_CREATED":
    case "MATERIAL_RESERVED":
      return "bg-yellow-600 hover:bg-yellow-600/80"
    default:
      return "bg-gray-500 hover:bg-gray-500/80"
  }
}

interface ProductionOrderDetailsClientProps {
  productionOrder: any // This will include activityLogs
}

export default function ProductionOrderDetailsClient({ productionOrder }: ProductionOrderDetailsClientProps) {
  const order = productionOrder // For easier access

  return (
    <div className="space-y-6 p-6 md:p-10">
      {/* Main Production Order Header Card */}
      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">{order.product.name}</CardTitle>
              <CardDescription className="text-base mt-1 flex items-center gap-2">
                <span className="font-medium text-foreground">{order.product.sku}</span> •{" "}
                <span>{order.quantity} units</span>
              </CardDescription>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <Badge
                variant={
                  order.status === "COMPLETED" ? "default" : order.status === "IN_PROGRESS" ? "secondary" : "outline"
                }
                className="text-lg py-1.5 px-4 uppercase font-medium"
              >
                {order.status.toLowerCase().replace("_", " ")}
              </Badge>
              <Badge
                variant={
                  order.priority === "HIGH" || order.priority === "URGENT"
                    ? "destructive"
                    : order.priority === "MEDIUM"
                      ? "secondary"
                      : "outline"
                }
              >
                {order.priority.toLowerCase()} priority
              </Badge>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {/* Information Grid - Simple Card Containers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timeline Card */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Start:</span> {formatDate(order.startDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Due:</span> {formatDate(order.dueDate)}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Order Information Card */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-primary">Order Information</CardTitle>
              </CardHeader>
              <CardContent>
                {order.customerOrder ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Order Details:</span> Customer Order
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Order #:</span> {order.customerOrder.orderNumber}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground italic p-4">No customer order linked</div>
                )}
              </CardContent>
            </Card>
            {/* Status Information Card */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-primary">Status Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Created:</span> {formatDate(order.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Updated:</span> {formatDate(order.updatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {order.notes && (
            <div className="mt-6">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                    <ActivityIcon className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="w-6 h-6" />
            Activity Log for Production Order {order.id.substring(0, 8)}
          </CardTitle>
          <CardDescription>
            A chronological record of significant actions and events related to this production order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Event Type</TableHead>
                  <TableHead className="w-[150px]">User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionOrder.activityLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No activity logs found for this production order.
                    </TableCell>
                  </TableRow>
                ) : (
                  productionOrder.activityLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge className={`${getBadgeColor(log.type)} text-white`}>{log.type.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.userName || log.userId}</TableCell>
                      <TableCell>{renderDetails(log.details)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
