"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns" // Import parseISO
import { ActivityIcon, Package, CalendarClock, ShoppingCart, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils" // Assuming formatDate utility exists

// Helper function to render JSON details in a more structured way
const renderDetails = (details: any, type: string) => {
  if (!details) return <span className="text-muted-foreground">N/A</span>

  // 'details' is now guaranteed to be a JavaScript object from the server action
  const parsedDetails = details

  // Specific rendering for QUALITY_CHECK_STATUS_UPDATED and QUALITY_CHECK_CREATED
  if (type === "QUALITY_CHECK_STATUS_UPDATED" || type === "QUALITY_CHECK_CREATED") {
    return (
      <div className="text-xs text-muted-foreground space-y-1">
        {parsedDetails.message && <p>{parsedDetails.message}</p>}
        {parsedDetails.newStatus && parsedDetails.previousStatus && (
          <div>
            <span className="font-medium">Status Change:</span> {parsedDetails.previousStatus} &rarr;{" "}
            {parsedDetails.newStatus}
          </div>
        )}
        {parsedDetails.inspectorId && (
          <div>
            <span className="font-medium">Inspector ID:</span> {parsedDetails.inspectorId}
          </div>
        )}
        {parsedDetails.qualityCheckId && (
          <div>
            <span className="font-medium">Check ID:</span> {parsedDetails.qualityCheckId}
          </div>
        )}
        {parsedDetails.defectsFound !== undefined && (
          <div>
            <span className="font-medium">Defects Found:</span> {String(parsedDetails.defectsFound)}
          </div>
        )}
        {parsedDetails.actionTaken && (
          <div>
            <span className="font-medium">Action Taken:</span> {parsedDetails.actionTaken}
          </div>
        )}
        {/* Special handling for nested workCenterStatus */}
        {parsedDetails.workCenterStatus && typeof parsedDetails.workCenterStatus === "object" && (
          <div>
            <span className="font-medium">Work Center Status:</span>{" "}
            {parsedDetails.workCenterStatus.operations &&
            Array.isArray(parsedDetails.workCenterStatus.operations) &&
            parsedDetails.workCenterStatus.operations.length > 0
              ? parsedDetails.workCenterStatus.operations[0].workCenterName || "N/A"
              : "N/A"}
          </div>
        )}
        {parsedDetails.notes && (
          <div>
            <span className="font-medium">Notes:</span> {parsedDetails.notes}
          </div>
        )}
      </div>
    )
  }

  // Handle PRODUCTION_ORDER_UPDATED with its specific 'changes' array
  if (type === "PRODUCTION_ORDER_UPDATED" && parsedDetails.changes && Array.isArray(parsedDetails.changes)) {
    return (
      <div className="space-y-1">
        {parsedDetails.notes && <p className="text-xs text-muted-foreground">{parsedDetails.notes}</p>}
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-2 py-1 text-left font-semibold">Field</th>
                <th className="px-2 py-1 text-left font-semibold">Old Value</th>
                <th className="px-2 py-1 text-left font-semibold">New Value</th>
              </tr>
            </thead>
            <tbody>
              {parsedDetails.changes.map((change: any, index: number) => (
                <tr key={index} className="border-t last:border-b-0">
                  <td className="px-2 py-1 font-medium">{change.field}</td>
                  <td className="px-2 py-1 text-muted-foreground">{String(change.oldValue)}</td>
                  <td className="px-2 py-1">{String(change.newValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Default rendering for other types
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      {Object.entries(parsedDetails).map(([key, value]) => {
        let displayKey = key.replace(/([A-Z])/g, " $1").trim() // Add space before capital letters
        displayKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1) // Capitalize first letter

        let displayValue: React.ReactNode = String(value)

        // Special handling for specific keys that should be displayed as plain text
        if (key === "message" || key === "notes") {
          return <p key={key}>{String(value)}</p>
        }

        // Special handling for workCenterStatus object (if it appears in other types)
        if (key === "workCenterStatus" && typeof value === "object" && value !== null) {
          displayKey = "Work Center Status"
          if (value.operations && Array.isArray(value.operations) && value.operations.length > 0) {
            displayValue = value.operations[0].workCenterName || "N/A"
          } else {
            displayValue = "N/A"
          }
        } else if (typeof value === "boolean") {
          displayValue = value ? "true" : "false"
        } else if (value && typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          // Attempt to format ISO date strings
          try {
            displayValue = format(parseISO(value), "MMM dd, yyyy HH:mm:ss") // Use parseISO here
          } catch (e) {
            displayValue = String(value) // Fallback if date parsing fails
          }
        } else if (typeof value === "object" && value !== null) {
          // For any other nested objects, stringify them
          displayValue = JSON.stringify(value)
        }

        return (
          <div key={key}>
            <span className="font-medium">{displayKey}:</span> {displayValue}
          </div>
        )
      })}
    </div>
  )
}

// Helper function to get badge color for activity log types
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
    case "QUALITY_CHECK_STATUS_UPDATED":
    case "QUALITY_CHECK_CREATED":
      return "bg-pink-500 hover:bg-pink-500/80" // Added specific color for quality checks
    default:
      return "bg-gray-500 hover:bg-gray-500/80"
  }
}

interface ProductionOrderActivityCardProps {
  order: any // ProductionOrder data
  activityLogs: any[] // ActivityLog data for this order
}

export const ProductionOrderActivityCard: React.FC<ProductionOrderActivityCardProps> = ({ order, activityLogs }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              {order.product.name}
              {order.productVariant && (
                <span className="text-lg font-normal text-muted-foreground"> - {order.productVariant.displayName}</span>
              )}
            </CardTitle>
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
              {order.status.toLowerCase().replace(/_/g, " ")}
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
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Start:</span> {formatDate(order.startDate)}
          </div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Due:</span> {formatDate(order.dueDate)}
          </div>
          {order.customerOrder && (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Customer Order #:</span> {order.customerOrder.orderNumber}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Created:</span> {formatDate(order.createdAt)}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Updated:</span> {formatDate(order.updatedAt)}
          </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-0 py-2 text-lg font-medium text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <ActivityIcon className="w-5 h-5" />
                Recent Activity ({activityLogs.length})
              </span>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="CollapsibleContent">
            <div className="overflow-x-auto mt-4">
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
                  {activityLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No activity logs found for this order.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activityLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className={`${getBadgeColor(log.type)} text-white`}>
                            {log.type.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.userName || log.userId}</TableCell>
                        <TableCell>{renderDetails(log.details, log.type)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(parseISO(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
