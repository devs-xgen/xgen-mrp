"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Factory, Package, AlertTriangle, CheckCircle2, Calendar, Settings } from "lucide-react"
import { analyzeCustomerOrder, createProductionOrdersWithDecisions } from "@/lib/actions/customer-order"
import { CustomerOrderAnalysis, ProductionDecisionInput, OrderLineAnalysis, StockStatus } from "@/types/admin/customer-order"
import { getAvailableWorkCenters } from "@/lib/actions/production-order"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface CreateProductionOrdersDialogProps {
  customerOrderId: string
  customerOrderNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProductionOrdersDialog({
  customerOrderId,
  customerOrderNumber,
  open,
  onOpenChange,
}: CreateProductionOrdersDialogProps) {
  const [analysis, setAnalysis] = useState<CustomerOrderAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [productionDecisions, setProductionDecisions] = useState<ProductionDecisionInput[]>([])
  const [workCenters, setWorkCenters] = useState<any[]>([])
  const [hasActiveWorkCenter, setHasActiveWorkCenter] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      if (customerOrderId) {
        fetchAnalysis()
      }
      checkWorkCenters()
    }
  }, [open, customerOrderId])

  const checkWorkCenters = async () => {
    try {
      const centers = await getAvailableWorkCenters()
      setWorkCenters(centers)
      setHasActiveWorkCenter(centers && centers.length > 0)
    } catch (error) {
      console.error("Failed to fetch work centers:", error)
      setHasActiveWorkCenter(false)
    }
  }

  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      
      // Get the customer order details first to extract order lines
      const response = await fetch(`/api/customerOrder/${customerOrderId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch customer order: ${response.statusText}`)
      }
      
      const customerOrder = await response.json()
      
      // Map order lines to the format expected by analyzeCustomerOrder
      const orderLines = customerOrder.orderLines.map((line: any) => ({
        productId: line.productId,
        productVariantId: line.productVariantId, // 🆕 ADD: Include variant ID
        quantity: line.quantity
      }))
      
      // Analyze the order lines
      const analysisResult = await analyzeCustomerOrder(orderLines)
      setAnalysis(analysisResult)
      
      // Initialize production decisions with recommended values
      const initialDecisions: ProductionDecisionInput[] = analysisResult.orderLines.map((lineAnalysis) => ({
        productId: lineAnalysis.productId,
        productVariantId: lineAnalysis.productVariantId, // 🆕 ADD: Include variant ID
        requiredQuantity: lineAnalysis.requestedQuantity,
        decision: lineAnalysis.recommendedOption,
        useAvailableStock: lineAnalysis.stockAvailability.stockStatus !== StockStatus.OUT_OF_STOCK,
        productionQuantity: lineAnalysis.requestedQuantity,
        reason: "Auto-generated from customer order analysis"
      }))
      
      setProductionDecisions(initialDecisions)
    } catch (error) {
      console.error("Failed to analyze customer order:", error)
      toast({
        title: "Error",
        description: "Failed to analyze customer order for production planning",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDecisionChange = (productId: string, productVariantId: string | undefined, field: keyof ProductionDecisionInput, value: any) => {
    setProductionDecisions(prev => prev.map(decision => 
      decision.productId === productId && decision.productVariantId === productVariantId
        ? { ...decision, [field]: value }
        : decision
    ))
  }

  const handleCreateProductionOrders = async () => {
    try {
      if (!hasActiveWorkCenter) {
        toast({
          title: "Error",
          description: "Cannot create production orders: No active work centers found",
          variant: "destructive",
        })
        return
      }
      
      setCreating(true)
      
      // Filter out decisions with 0 production quantity
      const validDecisions = productionDecisions.filter(decision => decision.productionQuantity > 0)
      
      console.log("Valid production decisions:", validDecisions)
      
      if (validDecisions.length === 0) {
        toast({
          title: "No Production Orders",
          description: "No products selected for production",
          variant: "destructive",
        })
        return
      }

      console.log(`Creating production orders for customer order: ${customerOrderId}`)
      console.log(`Number of decisions: ${validDecisions.length}`)

      const createdOrders = await createProductionOrdersWithDecisions(customerOrderId, validDecisions)
      
      console.log(`Successfully created ${createdOrders.length} production orders:`, createdOrders)
      
      toast({
        title: "Success",
        description: `Created ${createdOrders.length} production order${createdOrders.length === 1 ? '' : 's'}`,
      })

      // Close dialog and refresh
      onOpenChange(false)
      
      // Force a full page refresh to ensure the production order count is updated
      window.location.reload()
    } catch (error) {
      console.error("Failed to create production orders:", error)
      
      // Extract error message for user display
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      
      toast({
        title: "Error",
        description: `Failed to create production orders: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const getStockStatusBadge = (status: StockStatus) => {
    const config = {
      [StockStatus.SUFFICIENT]: { variant: "default" as const, className: "bg-green-500 text-white", icon: CheckCircle2 },
      [StockStatus.LOW_STOCK]: { variant: "secondary" as const, className: "bg-blue-500 text-white", icon: AlertTriangle },
      [StockStatus.INSUFFICIENT]: { variant: "secondary" as const, className: "bg-yellow-500 text-white", icon: AlertTriangle },
      [StockStatus.OUT_OF_STOCK]: { variant: "destructive" as const, className: "bg-red-500 text-white", icon: AlertTriangle },
    }
    
    const statusConfig = config[status] || config[StockStatus.OUT_OF_STOCK]
    const Icon = statusConfig.icon
    
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.toLowerCase().replace("_", " ")}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Create Production Orders for {customerOrderNumber}
          </DialogTitle>
          <DialogDescription>
            Review stock availability and configure production orders for this customer order
          </DialogDescription>
        </DialogHeader>

        {!hasActiveWorkCenter && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Active Work Centers</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>You need at least one active work center to create production orders.</span>
              <Link href="/admin/work-centers" onClick={() => onOpenChange(false)}>
                <Button variant="outline" size="sm" className="ml-2">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Work Centers
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Analyzing order requirements...</span>
            </div>
          ) : !analysis ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Analysis Failed</h3>
              <p className="text-muted-foreground">
                Unable to analyze this customer order.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Production Requirements Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Total Products</Label>
                      <p className="text-2xl font-bold">{analysis.orderLines.length}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Overall Status</Label>
                      <p className="text-lg font-medium">{analysis.overallStatus.replace("_", " ")}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Recommended Actions</Label>
                      <p className="text-lg font-medium">
                        {analysis.recommendedActions[0]?.replace("_", " ") || "None"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Analysis */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Product Production Decisions</h3>
                
                {analysis.orderLines.map((lineAnalysis, index) => {
                  const decision = productionDecisions.find(d => 
                    d.productId === lineAnalysis.productId && 
                    d.productVariantId === lineAnalysis.productVariantId
                  )
                  if (!decision) return null

                  const uniqueKey = `${lineAnalysis.productId}-${lineAnalysis.productVariantId || 'no-variant'}`
                  return (
                    <Card key={uniqueKey} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Package className="h-5 w-5" />
                              {lineAnalysis.productName}
                              <span className="text-sm font-normal text-muted-foreground">
                                ({lineAnalysis.productSku})
                              </span>
                              {lineAnalysis.variantDisplayName && (
                                <Badge variant="outline" className="ml-2">
                                  {lineAnalysis.variantDisplayName}
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Required: {lineAnalysis.requestedQuantity} units
                              {lineAnalysis.variantDisplayName && " (variant-specific)"}
                            </p>
                          </div>
                          {getStockStatusBadge(lineAnalysis.stockAvailability.stockStatus)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Stock Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Current Stock
                            </Label>
                            <p className="text-lg font-semibold">
                              {lineAnalysis.stockAvailability.currentStock}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Available Stock
                            </Label>
                            <p className="text-lg font-semibold">
                              {lineAnalysis.stockAvailability.availableStock}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Shortage
                            </Label>
                            <p className={`text-lg font-semibold ${
                              lineAnalysis.stockAvailability.shortfall < 0 ? 'text-destructive' : 'text-green-600'
                            }`}>
                              {lineAnalysis.stockAvailability.shortfall < 0 ? Math.abs(lineAnalysis.stockAvailability.shortfall) : 0}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Production Decision Form */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`produce-${uniqueKey}`}
                              checked={decision.productionQuantity > 0}
                              onCheckedChange={(checked) => {
                                handleDecisionChange(
                                  lineAnalysis.productId, 
                                  lineAnalysis.productVariantId, 
                                  'productionQuantity', 
                                  checked ? lineAnalysis.requestedQuantity : 0
                                )
                              }}
                              disabled={!hasActiveWorkCenter}
                            />
                            <Label htmlFor={`produce-${uniqueKey}`} className="font-medium">
                              Create production order for this {lineAnalysis.variantDisplayName ? 'variant' : 'product'}
                            </Label>
                          </div>

                          {decision.productionQuantity > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                              <div>
                                <Label htmlFor={`quantity-${uniqueKey}`}>Production Quantity</Label>
                                <Input
                                  id={`quantity-${uniqueKey}`}
                                  type="number"
                                  min="0"
                                  value={decision.productionQuantity}
                                  onChange={(e) => handleDecisionChange(
                                    lineAnalysis.productId, 
                                    lineAnalysis.productVariantId, 
                                    'productionQuantity', 
                                    parseInt(e.target.value) || 0
                                  )}
                                  className="mt-1"
                                  disabled={!hasActiveWorkCenter}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`reason-${uniqueKey}`}>Reason (Optional)</Label>
                                <Input
                                  id={`reason-${uniqueKey}`}
                                  value={decision.reason || ''}
                                  onChange={(e) => handleDecisionChange(
                                    lineAnalysis.productId, 
                                    lineAnalysis.productVariantId, 
                                    'reason', 
                                    e.target.value
                                  )}
                                  placeholder="Additional notes..."
                                  className="mt-1"
                                  disabled={!hasActiveWorkCenter}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {analysis && (
          <div className="flex-shrink-0 pt-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {productionDecisions.filter(d => d.productionQuantity > 0).length} production orders will be created
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProductionOrders}
                  disabled={creating || !hasActiveWorkCenter || productionDecisions.filter(d => d.productionQuantity > 0).length === 0}
                  className="min-w-[140px]"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Factory className="h-4 w-4 mr-2" />
                      Create Orders
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 