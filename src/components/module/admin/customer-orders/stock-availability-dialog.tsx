"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, XCircle, Package, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CustomerOrderAnalysis,
  ProductionDecision,
  ProductionDecisionInput,
  StockStatus,
  OverallOrderStatus,
  RecommendedAction,
} from "@/types/admin/customer-order";
import { analyzeCustomerOrder, createProductionOrdersWithDecisions } from "@/lib/actions/customer-order";

interface StockAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderLines: Array<{ productId: string; quantity: number; productName?: string }>;
  customerOrderId?: string;
  onProductionOrdersCreated?: (orders: any[]) => void;
}

export function StockAvailabilityDialog({
  open,
  onOpenChange,
  orderLines,
  customerOrderId,
  onProductionOrdersCreated,
}: StockAvailabilityDialogProps) {
  const [analysis, setAnalysis] = useState<CustomerOrderAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, ProductionDecisionInput>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open && orderLines.length > 0) {
      performAnalysis();
    }
  }, [open, orderLines]);

  const performAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeCustomerOrder(orderLines);
      setAnalysis(result);
      
      // Initialize decisions with recommended options
      const initialDecisions: Record<string, ProductionDecisionInput> = {};
      result.orderLines.forEach((line) => {
        const recommendedOption = line.productionOptions.find(
          option => option.type === line.recommendedOption
        );
        
        initialDecisions[line.productId] = {
          productId: line.productId,
          requiredQuantity: line.requestedQuantity,
          decision: line.recommendedOption,
          useAvailableStock: line.recommendedOption === ProductionDecision.USE_AVAILABLE_STOCK || 
                             line.recommendedOption === ProductionDecision.HYBRID_APPROACH,
          productionQuantity: recommendedOption?.productionQuantity || 0,
        };
      });
      setDecisions(initialDecisions);
    } catch (error) {
      console.error("Error analyzing customer order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionChange = (productId: string, decision: ProductionDecision) => {
    const orderLine = analysis?.orderLines.find(line => line.productId === productId);
    if (!orderLine) return;

    const selectedOption = orderLine.productionOptions.find(option => option.type === decision);
    if (!selectedOption) return;

    setDecisions(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        decision,
        useAvailableStock: decision === ProductionDecision.USE_AVAILABLE_STOCK || 
                          decision === ProductionDecision.HYBRID_APPROACH,
        productionQuantity: selectedOption.productionQuantity,
      }
    }));
  };

  const handleReasonChange = (productId: string, reason: string) => {
    setDecisions(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        reason,
      }
    }));
  };

  const handleCreateProductionOrders = async () => {
    if (!customerOrderId) {
      console.error("Customer order ID is required");
      return;
    }

    setCreating(true);
    try {
      const decisionsToCreate = Object.values(decisions).filter(
        decision => decision.productionQuantity > 0
      );

      if (decisionsToCreate.length === 0) {
        console.log("No production orders needed");
        onOpenChange(false);
        return;
      }

      const createdOrders = await createProductionOrdersWithDecisions(
        customerOrderId,
        decisionsToCreate
      );

      console.log("Created production orders:", createdOrders);
      onProductionOrdersCreated?.(createdOrders);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating production orders:", error);
    } finally {
      setCreating(false);
    }
  };

  const getStockStatusBadge = (status: StockStatus) => {
    switch (status) {
      case StockStatus.SUFFICIENT:
        return <Badge variant="default" className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Sufficient</Badge>;
      case StockStatus.LOW_STOCK:
        return <Badge variant="destructive" className="bg-yellow-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Low Stock</Badge>;
      case StockStatus.INSUFFICIENT:
        return <Badge variant="destructive" className="bg-orange-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Insufficient</Badge>;
      case StockStatus.OUT_OF_STOCK:
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getOverallStatusBadge = (status: OverallOrderStatus) => {
    switch (status) {
      case OverallOrderStatus.CAN_FULFILL_IMMEDIATELY:
        return <Badge variant="default" className="bg-green-500 text-white"><CheckCircle className="w-4 h-4 mr-1" />Can Fulfill Immediately</Badge>;
      case OverallOrderStatus.PARTIAL_FULFILLMENT:
        return <Badge variant="destructive" className="bg-yellow-500 text-white"><Package className="w-4 h-4 mr-1" />Partial Fulfillment</Badge>;
      case OverallOrderStatus.REQUIRES_PRODUCTION:
        return <Badge variant="destructive" className="bg-blue-500 text-white"><Clock className="w-4 h-4 mr-1" />Requires Production</Badge>;
      case OverallOrderStatus.MATERIAL_SHORTAGE:
        return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Material Shortage</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDecisionLabel = (decision: ProductionDecision) => {
    switch (decision) {
      case ProductionDecision.USE_AVAILABLE_STOCK:
        return "Use Available Stock";
      case ProductionDecision.FULL_PRODUCTION:
        return "Full Production";
      case ProductionDecision.HYBRID_APPROACH:
        return "Hybrid (Stock + Production)";
      case ProductionDecision.DELAY_UNTIL_MATERIALS:
        return "Delay Until Materials Available";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Analyzing Stock Availability...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Stock Availability Analysis
          </DialogTitle>
          <DialogDescription>
            Review stock levels and production requirements for your customer order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Order Status</span>
                {getOverallStatusBadge(analysis.overallStatus)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    ${analysis.totalEstimatedCost.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Estimated Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analysis.estimatedCompletionDate 
                      ? Math.ceil((analysis.estimatedCompletionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Days to Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analysis.orderLines.filter(line => 
                      line.stockAvailability.stockStatus !== StockStatus.SUFFICIENT
                    ).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Items Need Production</div>
                </div>
              </div>
              
              {analysis.recommendedActions.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Recommended Actions:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.recommendedActions.map((action, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Stock Overview</TabsTrigger>
              <TabsTrigger value="decisions">Production Decisions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Available Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Material Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.orderLines.map((line) => (
                    <TableRow key={line.productId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{line.productName}</div>
                          <div className="text-sm text-muted-foreground">{line.productSku}</div>
                        </div>
                      </TableCell>
                      <TableCell>{line.requestedQuantity}</TableCell>
                      <TableCell>{line.stockAvailability.currentStock}</TableCell>
                      <TableCell>{line.stockAvailability.availableStock}</TableCell>
                      <TableCell>{getStockStatusBadge(line.stockAvailability.stockStatus)}</TableCell>
                      <TableCell>
                        {line.materialAvailability.allMaterialsAvailable ? (
                          <Badge variant="default" className="bg-green-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />Available
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            {line.materialAvailability.materialShortages.length} Shortages
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="decisions" className="space-y-4">
              {analysis.orderLines.map((line) => (
                <Card key={line.productId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{line.productName}</CardTitle>
                    <CardDescription>
                      Required: {line.requestedQuantity} | Available: {line.stockAvailability.availableStock}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup
                      value={decisions[line.productId]?.decision || line.recommendedOption}
                      onValueChange={(value) => handleDecisionChange(line.productId, value as ProductionDecision)}
                    >
                      {line.productionOptions.map((option) => (
                        <div key={option.type} className="flex items-start space-x-2">
                          <RadioGroupItem 
                            value={option.type} 
                            id={`${line.productId}-${option.type}`}
                            disabled={!option.feasible}
                          />
                          <Label 
                            htmlFor={`${line.productId}-${option.type}`}
                            className={`flex-1 ${!option.feasible ? 'opacity-50' : ''}`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{getDecisionLabel(option.type)}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={option.feasible ? "secondary" : "destructive"}>
                                    {option.feasible ? "Feasible" : "Not Feasible"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    ${option.estimatedCost.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                              {option.risks.length > 0 && (
                                <div className="text-sm text-destructive">
                                  Risks: {option.risks.join(", ")}
                                </div>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor={`reason-${line.productId}`}>Reason (Optional)</Label>
                      <Textarea
                        id={`reason-${line.productId}`}
                        placeholder="Add any specific reason for this decision..."
                        value={decisions[line.productId]?.reason || ""}
                        onChange={(e) => handleReasonChange(line.productId, e.target.value)}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateProductionOrders}
            disabled={creating || !customerOrderId}
            className="flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Create Production Orders
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 