"use client";

import { useState } from "react";
import { Package, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { adjustProductStock, adjustVariantStock } from "@/lib/actions/product";

interface StockAdjustment {
  type: 'ADD' | 'REMOVE';
  quantity: number;
  reason: string;
}

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: {
    id: string;
    name: string;
    currentStock: number;
    minimumStockLevel: number;
  };
  variant?: {
    id: string;
    displayName: string;
    currentStock: number;
    minimumStockLevel: number;
  };
  onSuccess?: () => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  variant,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const { toast } = useToast();
  const [stockAdjustment, setStockAdjustment] = useState<StockAdjustment>({
    type: 'ADD',
    quantity: 0,
    reason: ''
  });

  // Get current item details (variant takes precedence over product)
  const currentItem = variant || product;
  const itemName = variant?.displayName || product?.name || '';
  const currentStock = currentItem?.currentStock || 0;
  const minimumStock = currentItem?.minimumStockLevel || 0;

  const handleQuantityChange = (newQuantity: number) => {
    setStockAdjustment(prev => ({ 
      ...prev, 
      quantity: Math.max(0, newQuantity)
    }));
  };

  const incrementQuantity = () => {
    setStockAdjustment(prev => ({ 
      ...prev, 
      quantity: prev.quantity + 1
    }));
  };

  const decrementQuantity = () => {
    setStockAdjustment(prev => ({ 
      ...prev, 
      quantity: Math.max(0, prev.quantity - 1)
    }));
  };

  const handleStockAdjustment = async () => {
    if (!stockAdjustment.quantity) {
      toast({
        title: "Error",
        description: "Please enter a quantity to adjust",
        variant: "destructive",
      });
      return;
    }

    // Provide default reason if not specified
    const reason = stockAdjustment.reason.trim() || `Stock ${stockAdjustment.type.toLowerCase()} via manual adjustment`;

    if (!currentItem) {
      toast({
        title: "Error",
        description: "No product or variant selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const adjustmentData = { ...stockAdjustment, reason };
      
      if (variant) {
        await adjustVariantStock(variant.id, adjustmentData);
      } else if (product) {
        await adjustProductStock(product.id, adjustmentData);
      }
      
      toast({
        title: "Success",
        description: "Stock adjusted successfully",
      });
      
      // Reset form
      setStockAdjustment({ type: 'ADD', quantity: 0, reason: '' });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error?.message || "Failed to adjust stock",
        variant: "destructive",
      });
    }
  };

  const calculateNewStock = () => {
    if (stockAdjustment.type === 'ADD') {
      return currentStock + stockAdjustment.quantity;
    } else {
      return Math.max(0, currentStock - stockAdjustment.quantity);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Adjust Stock Level
          </DialogTitle>
          <DialogDescription>
            Adjust stock for {itemName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Stock Display */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Current Stock</Label>
              <p className="text-lg font-semibold">{currentStock}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Minimum Level</Label>
              <p className="text-lg font-semibold">{minimumStock}</p>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-3">
            <Label>What will you do?</Label>
            <Button
              type="button"
              variant={stockAdjustment.type === 'ADD' ? 'default' : 'secondary'}
              onClick={() => setStockAdjustment(prev => ({ 
                ...prev, 
                type: prev.type === 'ADD' ? 'REMOVE' : 'ADD' 
              }))}
              className="w-full h-12 text-base font-medium"
            >
              {stockAdjustment.type === 'ADD' ? (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add stock to inventory
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 mr-2" />
                  Remove stock from inventory
                </>
              )}
            </Button>
          </div>

          {/* Quantity Input with +/- Buttons */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity to {stockAdjustment.type === 'ADD' ? 'Add' : 'Remove'}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={decrementQuantity}
                disabled={stockAdjustment.quantity <= 0}
                className="h-10 w-10 p-0 flex-shrink-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={stockAdjustment.quantity || ''}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="text-center font-medium"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={incrementQuantity}
                className="h-10 w-10 p-0 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick quantity buttons */}
            <div className="flex gap-2 flex-wrap">
              {[1, 5, 10, 25, 50].map((qty) => (
                <Button
                  key={qty}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(qty)}
                  className="text-xs px-2 py-1 h-auto"
                >
                  {qty}
                </Button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              id="reason"
              value={stockAdjustment.reason}
              onChange={(e) => setStockAdjustment(prev => ({ 
                ...prev, 
                reason: e.target.value 
              }))}
              placeholder="Enter reason for adjustment (optional - a default reason will be used if left blank)"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* New Stock Level Preview */}
          {stockAdjustment.quantity > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">New Stock Level:</Label>
                <p className="text-lg font-semibold">
                  {calculateNewStock()} units
                </p>
              </div>
              {calculateNewStock() <= minimumStock && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ New stock level will be at or below minimum threshold
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStockAdjustment}
            disabled={!stockAdjustment.quantity}
            className="w-full sm:w-auto"
          >
            Apply Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 