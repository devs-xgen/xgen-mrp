"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Utility function to render JSON details for ActivityLog
const renderDetails = (details: any) => {
  if (!details) return "N/A"
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
      // Assuming your /api/activity-log endpoint also includes the 'user' relation
      const response = await fetch(`/api/activity-log?productionOrderId=${productionOrderId}`)
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Production History</CardTitle>
            <CardDescription>Log of status changes and important events</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchProductionLogs} disabled={loadingLogs}>
              {loadingLogs ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {loadingLogs ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-500">
              <p>Error loading logs: {error}</p>
              <Button variant="ghost" size="sm" onClick={fetchProductionLogs} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : productionLogs.length > 0 ? (
            <div className="space-y-4">
              {productionLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-2 text-sm border-l-2 pl-4 py-1 border-muted">
                  <div className="flex-1">
                    <p className="font-medium">{log.type.replace(/_/g, " ")}</p>
                    {log.details && <p className="text-muted-foreground">{renderDetails(log.details)}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      By {log.user?.name || log.userId || "Unknown user"} {/* Display user name or fallback to ID */}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">No production history available</div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
