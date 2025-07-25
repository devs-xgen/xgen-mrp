import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, parseISO } from "date-fns"
import type { ActivityLog } from "@prisma/client" // Assuming ActivityLog type from Prisma
import { getProductionLogs } from "@/lib/actions/inspector/production-order" // Import inspector-specific action

interface InspectorProductionHistoryProps {
  productionOrderId: string
}

// Helper to render details based on log type
const renderLogDetails = (log: ActivityLog) => {
  const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details // Ensure details is an object

  switch (log.type) {
    case "PRODUCTION_STATUS_CHANGE":
      return (
        <>
          <p>
            Status changed from <span className="font-medium">{details.previousStatus}</span> to{" "}
            <span className="font-medium">{details.newStatus}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.actionTaken && <p className="text-xs text-muted-foreground">Action Taken: {details.actionTaken}</p>}
        </>
      )
    case "OPERATION_CREATED":
      return (
        <>
          <p>
            Operation created for work center: <span className="font-medium">{details.workCenterId}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "OPERATION_DELETED":
      return (
        <>
          <p>
            Operation <span className="font-medium">{details.operationId}</span> deleted.
          </p>
          {details.workCenterName && (
            <p className="text-xs text-muted-foreground">Work Center: {details.workCenterName}</p>
          )}
        </>
      )
    case "OPERATION_STATUS_CHANGE":
      return (
        <>
          <p>
            Operation <span className="font-medium">{details.operationId}</span> status changed from{" "}
            <span className="font-medium">{details.previousStatus}</span> to{" "}
            <span className="font-medium">{details.newStatus}</span>.
          </p>
          {details.workCenterName && (
            <p className="text-xs text-muted-foreground">Work Center: {details.workCenterName}</p>
          )}
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "CUSTOMER_ORDER_LINKED":
      return (
        <>
          <p>
            Linked to customer order: <span className="font-medium">{details.customerOrderId}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "MATERIAL_REQUEST_CREATED":
      return (
        <>
          <p>
            Material request created for {details.itemCount} items. Request ID:{" "}
            <span className="font-medium">{details.materialRequestId?.substring(0, 8)}...</span>
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "PRODUCTION_ORDER_CREATED":
      return (
        <>
          <p>
            Production order created for <span className="font-medium">{details.productName}</span> ({details.quantity}{" "}
            units).
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "PRODUCTION_ORDER_UPDATED":
      return (
        <>
          <p>Production order details updated.</p>
          {details.changes && Array.isArray(details.changes) && (
            <ul className="list-disc list-inside text-xs text-muted-foreground">
              {details.changes.map((change: any, i: number) => (
                <li key={i}>
                  {change.field}: {String(change.oldValue)} {"->"} {String(change.newValue)}
                </li>
              ))}
            </ul>
          )}
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "MATERIAL_RELEASED":
      return (
        <>
          <p>
            Materials released for <span className="font-medium">{details.productName}</span> ({details.quantity}{" "}
            units).
          </p>
          {details.reason && <p className="text-xs text-muted-foreground">Reason: {details.reason}</p>}
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.actionTaken && <p className="text-xs text-muted-foreground">Action Taken: {details.actionTaken}</p>}
        </>
      )
    case "PRODUCT_STOCK_INCREMENT":
      return (
        <>
          <p>
            Product stock incremented for <span className="font-medium">{details.productName}</span> by{" "}
            <span className="font-medium">{details.change}</span> units.
          </p>
          {details.reason && <p className="text-xs text-muted-foreground">Reason: {details.reason}</p>}
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.actionTaken && <p className="text-xs text-muted-foreground">Action Taken: {details.actionTaken}</p>}
        </>
      )
    case "PRODUCTION_ORDER_DELETED":
      return (
        <>
          <p>
            Production order for <span className="font-medium">{details.productName}</span> ({details.productSku})
            deleted.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "PRODUCTION_BOM_CREATED":
      return (
        <>
          <p>
            Production Bill of Materials created for <span className="font-medium">{details.productName}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "MATERIAL_RESERVED":
      return (
        <>
          <p>
            Materials reserved for <span className="font-medium">{details.productName}</span> ({details.quantity}{" "}
            units).
          </p>
          {details.reason && <p className="text-xs text-muted-foreground">Reason: {details.reason}</p>}
        </>
      )
    case "QUALITY_CHECK_CREATED":
      return (
        <>
          <p>
            Quality check <span className="font-medium">{details.qualityCheckId?.substring(0, 8)}...</span> created.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.takenAction && <p className="text-xs text-muted-foreground">Action Taken: {details.takenAction}</p>}
        </>
      )
    case "QUALITY_CHECK_STATUS_UPDATED":
      return (
        <>
          <p>
            Quality check <span className="font-medium">{details.qualityCheckId?.substring(0, 8)}...</span> status
            updated from <span className="font-medium">{details.previousStatus}</span> to{" "}
            <span className="font-medium">{details.newStatus}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.takenAction && <p className="text-xs text-muted-foreground">Action Taken: {details.takenAction}</p>}
        </>
      )
    default:
      return <p>{log.summary || `Unknown action: ${log.type}`}</p>
  }
}

export async function InspectorProductionHistory({ productionOrderId }: InspectorProductionHistoryProps) {
  // Fetch logs directly within the component as it's a Server Component
  const activityLogs = await getProductionLogs(productionOrderId) // Use inspector-specific action

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Production History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {activityLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity recorded for this order yet.</p>
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)] pr-4">
            <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
              {activityLogs.map((log) => (
                <li key={log.id} className="mb-6 ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white dark:bg-blue-900 dark:ring-gray-900">
                    <svg
                      className="h-4 w-4 text-blue-800 dark:text-blue-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </span>
                  <h3 className="mb-1 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                    {log.summary || log.type.replace(/_/g, " ")}
                  </h3>
                  <time className="mb-2 block text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                    {format(parseISO(log.timestamp.toISOString()), "MMM dd, yyyy HH:mm")} by {log.userName}
                  </time>
                  <div className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
                    {renderLogDetails(log)}
                  </div>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
