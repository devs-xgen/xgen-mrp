import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, ClipboardCheck, AlertTriangle, MessageSquare, Calendar, Factory } from "lucide-react"
import Link from "next/link"
import { ProductionOrderDetails } from "@/components/module/admin/production/production-order-details"

interface ProductionOrderPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ProductionOrderPageProps): Promise<Metadata> {
  const productionOrder = await getProductionOrderForInspector(params.id)

  if (!productionOrder) {
    return {
      title: "Production Order Not Found",
    }
  }

  return {
    title: `Production Order - ${productionOrder.product.name}`,
    description: `View details, reports, and quality checks for production order ${productionOrder.id}`,
  }
}

export default async function ProductionOrderPage({ params }: ProductionOrderPageProps) {
  const productionOrder = await getProductionOrderForInspector(params.id)

  if (!productionOrder) {
    notFound()
  }

  // Get all related data and serialize it
  const [reports, qualityChecks] = await Promise.all([
    getActiveReports()
      .then((data) => ({
        productionIssues: data.productionIssues
          .filter((issue) => issue.productionOrderId === params.id)
          .map(serializeProductionIssue),
        inventoryAlerts: data.inventoryAlerts, // Keep all for context
        qualityIssues: data.qualityIssues
          .filter((check) => check.productionOrderId === params.id)
          .map(serializeQualityCheck),
      }))
      .catch(() => ({
        productionIssues: [],
        inventoryAlerts: [],
        qualityIssues: [],
      })),
    getQualityChecksByInspector({ productionOrderId: params.id })
      .then((checks) => checks.map(serializeQualityCheck))
      .catch(() => []),
  ])

  // Serialize the production order
  const serializedProductionOrder = serializeProductionOrder(productionOrder)

  // Calculate summary statistics
  const totalQualityChecks = qualityChecks.length
  const failedQualityChecks = qualityChecks.filter((qc) => qc.failedQuantity > 0).length
  const criticalIssues = [
    ...reports.productionIssues.filter((issue) => issue.severity === "CRITICAL"),
    ...qualityChecks.filter((qc) => qc.severity === "CRITICAL"),
  ].length
  const openIssues = reports.productionIssues.filter((issue) => issue.status === "OPEN").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "ON_HOLD":
        return "bg-red-100 text-red-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inspector/production-tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{serializedProductionOrder.product.name}</h1>
            <p className="text-muted-foreground">
              Production Order #{serializedProductionOrder.id.slice(-8)} • SKU: {serializedProductionOrder.product.sku}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(serializedProductionOrder.status)}>{serializedProductionOrder.status}</Badge>
          <Badge className={getPriorityColor(serializedProductionOrder.priority)}>
            {serializedProductionOrder.priority}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serializedProductionOrder.quantity}</div>
            <p className="text-xs text-muted-foreground">Units to produce</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Checks</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQualityChecks}</div>
            <p className="text-xs text-muted-foreground">{failedQualityChecks} with failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openIssues}</div>
            <p className="text-xs text-muted-foreground">{criticalIssues} critical</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operations</CardTitle>
            <Factory className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serializedProductionOrder.operations.length}</div>
            <p className="text-xs text-muted-foreground">
              {serializedProductionOrder.operations.filter((op) => op.status === "COMPLETED").length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Critical Issues Detected</p>
              <p className="text-sm text-red-700 mt-1">
                This production order has {criticalIssues} critical issue(s) that require immediate attention.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Quality Checks ({totalQualityChecks})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Issues ({reports.productionIssues.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProductionOrderDetails productionOrder={serializedProductionOrder} />
        </TabsContent>

        <TabsContent value="quality">
          <ProductionOrderQualityChecks productionOrderId={params.id} qualityChecks={qualityChecks} />
        </TabsContent>

        <TabsContent value="reports">
          <ProductionOrderReports productionOrderId={params.id} reports={reports} />
        </TabsContent>

        <TabsContent value="timeline">
          <ProductionOrderTimeline
            productionOrder={serializedProductionOrder}
            qualityChecks={qualityChecks}
            reports={reports.productionIssues}
          />
        </TabsContent>

        <TabsContent value="comments">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Comments and communication history for this production order
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
function getProductionOrderForInspector(id: string) {
  throw new Error("Function not implemented.")
}

function getActiveReports() {
  throw new Error("Function not implemented.")
}

function getQualityChecksByInspector(arg0: { productionOrderId: string }) {
  throw new Error("Function not implemented.")
}

