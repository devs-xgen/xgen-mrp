// "use client"

// import type React from "react"
// import { useState, useEffect, useCallback } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Button } from "@/components/ui/button"
// import { Loader2 } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"

// // Utility function to render JSON details for ActivityLog
// const renderDetails = (details: any) => {
//   if (!details) return "N/A"
//   return (
//     <div className="text-xs text-muted-foreground max-w-[300px] truncate">
//       {Object.entries(details).map(([key, value]) => (
//         <div key={key}>
//           <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>{" "}
//           {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}
//         </div>
//       ))}
//     </div>
//   )
// }

// interface ProductionHistoryProps {
//   productionOrderId: string
// }

// export const ProductionHistory: React.FC<ProductionHistoryProps> = ({ productionOrderId }) => {
//   const [productionLogs, setProductionLogs] = useState<any[]>([])
//   const [loadingLogs, setLoadingLogs] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const { toast } = useToast()

//   const fetchProductionLogs = useCallback(async () => {
//     setLoadingLogs(true)
//     setError(null)
//     try {
//       // Assuming your /api/activity-log endpoint also includes the 'user' relation
//       const response = await fetch(`/api/activity-log?productionOrderId=${productionOrderId}`)
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`)
//       }
//       const logsData = await response.json()
//       setProductionLogs(logsData)
//     } catch (err) {
//       console.error("Failed to fetch production logs:", err)
//       setError(err instanceof Error ? err.message : "Failed to fetch logs")
//       toast({
//         title: "Error",
//         description: "Failed to load production history.",
//         variant: "destructive",
//       })
//     } finally {
//       setLoadingLogs(false)
//     }
//   }, [productionOrderId, toast])

//   useEffect(() => {
//     fetchProductionLogs()
//   }, [fetchProductionLogs])

//   return (
//     <Card>
//       <CardHeader className="pb-3">
//         <div className="flex justify-between items-center">
//           <div>
//             <CardTitle className="text-lg">Production History</CardTitle>
//             <CardDescription>Log of status changes and important events</CardDescription>
//           </div>
//           <div className="flex gap-2">
//             <Button variant="outline" size="sm" onClick={fetchProductionLogs} disabled={loadingLogs}>
//               {loadingLogs ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
//               Refresh
//             </Button>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <ScrollArea className="h-[200px]">
//           {loadingLogs ? (
//             <div className="flex justify-center p-4">
//               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//             </div>
//           ) : error ? (
//             <div className="text-center p-4 text-red-500">
//               <p>Error loading logs: {error}</p>
//               <Button variant="ghost" size="sm" onClick={fetchProductionLogs} className="mt-2">
//                 Try Again
//               </Button>
//             </div>
//           ) : productionLogs.length > 0 ? (
//             <div className="space-y-4">
//               {productionLogs.map((log: any) => (
//                 <div key={log.id} className="flex items-start gap-2 text-sm border-l-2 pl-4 py-1 border-muted">
//                   <div className="flex-1">
//                     <p className="font-medium">{log.type.replace(/_/g, " ")}</p>
//                     {log.details && <p className="text-muted-foreground">{renderDetails(log.details)}</p>}
//                     <p className="text-xs text-muted-foreground mt-1">
//                       By {log.user?.name || log.userId || "Unknown user"} {/* Display user name or fallback to ID */}
//                     </p>
//                   </div>
//                   <div className="text-xs text-muted-foreground whitespace-nowrap">
//                     {new Date(log.createdAt).toLocaleString()}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center p-4 text-muted-foreground">No production history available</div>
//           )}
//         </ScrollArea>
//       </CardContent>
//     </Card>
//   )
// }
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns" // Import parseISO

// Helper function to render JSON details for ActivityLog
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

// Helper function to get border color for activity log types
const getBorderColor = (type: string) => {
  switch (type) {
    case "PRODUCTION_STATUS_CHANGE":
      return "border-blue-500"
    case "PRODUCT_STOCK_INCREMENT":
      return "border-green-500"
    case "PRODUCTION_ORDER_DELETED":
      return "border-red-500"
    case "MATERIAL_RELEASED":
      return "border-orange-500"
    case "PRODUCTION_ORDER_CREATED":
      return "border-purple-500"
    case "PRODUCTION_ORDER_UPDATED":
      return "border-indigo-500"
    case "OPERATION_CREATED":
    case "OPERATION_DELETED":
    case "OPERATION_STATUS_CHANGE":
      return "border-cyan-500"
    case "CUSTOMER_ORDER_LINKED":
      return "border-teal-500"
    case "PRODUCTION_STARTED":
      return "border-lime-600"
    case "ADMIN_WORKFLOW_OVERRIDE":
    case "SECURITY_ADMIN_ACTION":
      return "border-rose-700"
    case "PRODUCTION_BOM_CREATED":
    case "MATERIAL_RESERVED":
      return "border-yellow-600"
    case "QUALITY_CHECK_STATUS_UPDATED":
    case "QUALITY_CHECK_CREATED":
      return "border-pink-500"
    default:
      return "border-gray-400"
  }
}

interface ProductionHistoryProps {
  productionOrderId: string
}

export const ProductionHistory: React.FC<ProductionHistoryProps> = ({ productionOrderId }) => {
  const [productionLogs, setProductionLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProductionLogs = useCallback(async () => {
    setLoadingLogs(true)
    setError(null)
    try {
      const response = await fetch(`/api/activity-log?productionOrderId=${productionOrderId}`, {
        cache: "no-store",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const logsData = await response.json()
      setProductionLogs(logsData)
    } catch (err) {
      console.error("Failed to fetch production logs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch logs")
      toast({
        title: "Error",
        description: "Failed to load production history.",
        variant: "destructive",
      })
    } finally {
      setLoadingLogs(false)
    }
  }, [productionOrderId, toast])

  useEffect(() => {
    fetchProductionLogs()
  }, [fetchProductionLogs])

  return (
    <Card className="rounded-3xl border border-border/70 bg-card/80 shadow-lg backdrop-blur">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/50 via-background to-muted/30 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Production History</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Log of status changes and key workflow events
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProductionLogs}
            disabled={loadingLogs}
            className="gap-2"
          >
            {loadingLogs && <Loader2 className="h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[240px] px-6 py-4">
          {loadingLogs ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading history...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
              <p className="font-medium">Error loading logs</p>
              <p className="mt-1 text-destructive-foreground/80">{error}</p>
              <Button variant="ghost" size="sm" onClick={fetchProductionLogs} className="mt-3">
                Try Again
              </Button>
            </div>
          ) : productionLogs.length > 0 ? (
            <div className="space-y-4">
              {productionLogs.map((log: any) => (
                <div
                  key={log.id}
                  className={`flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm shadow-sm transition-colors ${getBorderColor(log.type)} border-l-4`}
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-foreground">{log.type.replace(/_/g, " ")}</p>
                    {log.details && <div className="text-muted-foreground">{renderDetails(log.details, log.type)}</div>}
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>By {log.userName || log.userId || "Unknown user"}</span>
                    <span>{format(parseISO(log.timestamp), "MMM dd, yyyy HH:mm:ss")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 py-8 text-center text-muted-foreground">
              No production history available
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
