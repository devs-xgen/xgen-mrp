"use client";

import { useState } from "react";
import { Priority } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Factory, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

import { OrderLineStockStatus, CustomerOrderAnalysisResult, ProductionDecision } from "@/types/admin/order-analysis";
import { formatCurrencyPHP } from "@/lib/constant";

interface ProductionPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderLines: OrderLineStockStatus[];
  orderAnalysis: CustomerOrderAnalysisResult;
  onConfirm: (selections: any[]) => void;
  isLoading: boolean;
}

export function ProductionPlanningDialog({
  open,
  onOpenChange,
  orderLines,
  orderAnalysis,
  onConfirm,
  isLoading,
}: ProductionPlanningDialogProps) {
  const router = useRouter();
  const [selections, setSelections] = useState<{
    [lineId: string]: {
      decision: ProductionDecision;
      priority: Priority;
      notes: string;
    };
  }>({});

  const handleSelectionChange = (
    lineId: string,
    field: keyof typeof selections[string],
    value: any
  ) => {
    setSelections(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [field]: value,
      },
    }));
  };

  const handleConfirm = () => {
    const productionSelections = orderLines.map(line => {
      const selection = selections[line.id];
      return {
        orderLineId: line.id,
        productId: line.productId,
        productVariantId: line.productVariantId,
        decision: selection?.decision || ProductionDecision.FULL_PRODUCTION,
        stockToAllocate: line.stockToUse,
        quantityToProduce: line.quantityToProduce,
        priority: selection?.priority || Priority.MEDIUM,
        notes: selection?.notes || `Production required for order ${orderAnalysis.orderNumber}`,
      };
    });

    onConfirm(productionSelections);
  };

  const handleUseWizard = () => {
    // Prepare batch items for the production wizard
    const batchItems = orderLines.map(line => {
      const selection = selections[line.id];
      return {
        productId: line.productId,
        productVariantId: line.productVariantId,
        quantity: line.quantityToProduce,
        customerOrderId: orderAnalysis.orderId,
        priority: selection?.priority || "MEDIUM" as const,
        notes: selection?.notes || `Production required for order ${orderAnalysis.orderNumber}`,
      };
    });

    // Navigate to production create with batch data
    const batchData = encodeURIComponent(JSON.stringify({
      batchMode: true,
      batchItems,
      customerOrderId: orderAnalysis.orderId,
      customerOrderNumber: orderAnalysis.orderNumber,
    }));
    
    router.push(`/admin/production/create?batch=${batchData}`);
  };

  const totalProductionCost = orderLines.reduce((sum, line) => {
    return sum + (line.quantityToProduce * line.unitPrice);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Create Production Orders
          </DialogTitle>
          <DialogDescription>
            Configure production orders for items requiring production.
            Total estimated cost: <strong>{formatCurrencyPHP(totalProductionCost)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Stock to Use</TableHead>
                  <TableHead>Qty to Produce</TableHead>
                  <TableHead>Production Decision</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{line.productName}</p>
                        <p className="text-sm text-muted-foreground">{line.productSku}</p>
                        {line.variantDisplayName && (
                          <Badge variant="outline" className="text-xs">
                            {line.variantDisplayName}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {line.stockToUse > 0 ? line.stockToUse : '-'}
                    </TableCell>
                    <TableCell className="font-medium text-orange-600">
                      {line.quantityToProduce}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selections[line.id]?.decision || ProductionDecision.FULL_PRODUCTION}
                        onValueChange={(value) => 
                          handleSelectionChange(line.id, 'decision', value as ProductionDecision)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ProductionDecision.FULL_PRODUCTION}>
                            Full Production
                          </SelectItem>
                          {line.stockToUse > 0 && (
                            <SelectItem value={ProductionDecision.HYBRID_APPROACH}>
                              Hybrid (Stock + Production)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selections[line.id]?.priority || Priority.MEDIUM}
                        onValueChange={(value) => 
                          handleSelectionChange(line.id, 'priority', value as Priority)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Priority.LOW}>Low</SelectItem>
                          <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                          <SelectItem value={Priority.HIGH}>High</SelectItem>
                          <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
                          <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="Production notes..."
                        value={selections[line.id]?.notes || ''}
                        onChange={(e) => 
                          handleSelectionChange(line.id, 'notes', e.target.value)
                        }
                        className="min-h-0 h-8"
                        rows={1}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Production Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Items requiring production:</span>
                <span className="ml-2 font-medium">{orderLines.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total estimated cost:</span>
                <span className="ml-2 font-medium">{formatCurrencyPHP(totalProductionCost)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Order:</span>
                <span className="ml-2 font-medium">{orderAnalysis.orderNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Required by:</span>
                <span className="ml-2 font-medium">
                  {orderAnalysis.requiredDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleUseWizard}
            disabled={isLoading || orderLines.length === 0}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Use Production Wizard
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || orderLines.length === 0}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create {orderLines.length} Production Order{orderLines.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
