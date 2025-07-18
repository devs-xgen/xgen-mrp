// This component will now be a Server Component to fetch data directly
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Package, CheckCircle, AlertTriangle, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getProductionOrderHistory } from "@/lib/actions/history-log/production-order-history"

interface ProductionHistoryTimelineProps {
  productionOrderId: string
}

export default async function ProductionHistoryTimeline({ productionOrderId }: ProductionHistoryTimelineProps) {
  const { data: historyLogs, success, error } = await getProductionOrderHistory(productionOrderId)

  if (!success) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-60px)] flex items-center justify-center">
          <p className="text-red-500">Error loading history: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "PRODUCTION_ORDER_CREATED":
        return <Package className="h-3 w-3" />
      case "OPERATION_STARTED":
        return <Clock className="h-3 w-3" />
      case "QUALITY_CHECK_PASSED":
        return <CheckCircle className="h-3 w-3" />
      case "PRODUCTION_ORDER_UPDATED":
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)]">
        {historyLogs.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">No history logs found for this order.</div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {historyLogs.map((log) => (
                  <div key={log.id} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {getIconForType(log.changeType)}
                    </div>

                    {/* Log content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-semibold">{log.changeType.replace(/_/g, " ")}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">{log.notes}</p>

                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">
                          {log.user?.profile
                            ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
                            : log.user?.email || "Unknown User"}
                        </span>
                        {log.status && (
                          <Badge variant="secondary" className="text-xs">
                            Status: {log.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
