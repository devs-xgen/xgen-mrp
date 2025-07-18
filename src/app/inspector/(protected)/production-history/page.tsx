import ProductionHistoryDashboard from "@/components/module/history-logs/production-history-dashboard";
import ProductionHistoryTimeline from "@/components/module/history-logs/production-history-timeline";


export default function ProductionHistoryPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Production Order History</h1>
          <p className="text-muted-foreground">Comprehensive tracking and visualization of production activities</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ProductionHistoryDashboard />
          </div>
          <div>
            <ProductionHistoryTimeline />
          </div>
        </div>
      </div>
    </div>
  )
}
