"use client";

import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Package, CheckCircle, AlertTriangle } from "lucide-react";

import { OrderLineStockStatus, CustomerOrderAnalysisResult } from "@/types/admin/order-analysis";
import { formatCurrencyPHP } from "@/lib/constant";

interface StockAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderLines: OrderLineStockStatus[];
  orderAnalysis: CustomerOrderAnalysisResult;
  onConfirm: (allocations: any[]) => void;
  isLoading: boolean;
}

export function StockAllocationDialog({
  open,
  onOpenChange,
  orderLines,
  orderAnalysis,
  onConfirm,
  isLoading,
}: StockAllocationDialogProps) {
  const [allocations, setAllocations] = useState<{
    [lineId: string]: {
      quantityToAllocate: number;
      notes: string;
    };
  }>(() => {
    // Initialize with recommended stock allocation amounts
    const initial: typeof allocations = {};
    orderLines.forEach(line => {
      initial[line.id] = {
        quantityToAllocate: line.stockToUse,
        notes: '',
      };
    });
    return initial;
  });

  const handleAllocationChange = (
    lineId: string,
    field: keyof typeof allocations[string],
    value: any
  ) => {
    setAllocations(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [field]: value,
      },
    }));
  };

  const handleConfirm = () => {
    const stockAllocations = orderLines.map(line => {
      const allocation = allocations[line.id];
      return {
        orderLineId: line.id,
        productId: line.productId,
        productVariantId: line.productVariantId,
        quantityToAllocate: allocation?.quantityToAllocate || 0,
        reservationDate: new Date(),
        notes: allocation?.notes || `Stock allocation for order ${orderAnalysis.orderNumber}`,
      };
    }).filter(allocation => allocation.quantityToAllocate > 0);

    onConfirm(stockAllocations);
  };

  const totalAllocationValue = orderLines.reduce((sum, line) => {
    const allocation = allocations[line.id];
    const qty = allocation?.quantityToAllocate || 0;
    return sum + (qty * line.unitPrice);
  }, 0);

  const validateAllocation = (line: OrderLineStockStatus, quantity: number) => {
    if (quantity <= 0) return { valid: false, message: "Quantity must be greater than 0" };
    if (quantity > line.currentStock) return { valid: false, message: "Exceeds available stock" };
    if (quantity > line.quantity) return { valid: false, message: "Exceeds requested quantity" };
    return { valid: true, message: "" };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Allocate Stock
          </DialogTitle>
          <DialogDescription>
            Allocate available stock for items that can be fulfilled from inventory.
            Total allocation value: <strong>{formatCurrencyPHP(totalAllocationValue)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Available Stock</TableHead>
                  <TableHead>Recommended</TableHead>
                  <TableHead>Allocate Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderLines.map((line) => {
                  const allocation = allocations[line.id];
                  const validation = validateAllocation(line, allocation?.quantityToAllocate || 0);
                  
                  return (
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
                        {line.quantity}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{line.currentStock}</span>
                          <span className="text-sm text-muted-foreground">
                            Min: {line.minimumStockLevel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {line.stockToUse}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={line.currentStock}
                          value={allocation?.quantityToAllocate || 0}
                          onChange={(e) => 
                            handleAllocationChange(
                              line.id, 
                              'quantityToAllocate', 
                              parseInt(e.target.value) || 0
                            )
                          }
                          className={`w-20 ${!validation.valid ? 'border-red-500' : ''}`}
                        />
                        {!validation.valid && (
                          <p className="text-xs text-red-500 mt-1">{validation.message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {validation.valid && allocation?.quantityToAllocate > 0 ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Textarea
                          placeholder="Allocation notes..."
                          value={allocation?.notes || ''}
                          onChange={(e) => 
                            handleAllocationChange(line.id, 'notes', e.target.value)
                          }
                          className="min-h-0 h-8"
                          rows={1}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Allocation Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Items to allocate:</span>
                <span className="ml-2 font-medium">
                  {Object.values(allocations).filter(a => a.quantityToAllocate > 0).length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total allocation value:</span>
                <span className="ml-2 font-medium">{formatCurrencyPHP(totalAllocationValue)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Order:</span>
                <span className="ml-2 font-medium">{orderAnalysis.orderNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <span className="ml-2 font-medium">{orderAnalysis.customerName}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={
              isLoading || 
              Object.values(allocations).every(a => a.quantityToAllocate <= 0)
            }
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Allocate Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
