import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Play, CheckCircle } from 'lucide-react';
import { Status } from '@prisma/client';
import { getProductionOrder, updateProductionOrderStatus, startProductionWithValidation } from '@/lib/actions/production-order';
import { ProductBOM } from '@/types/admin/bom';
import { useToast } from '@/hooks/use-toast';
import { ProductionOrderControlButtons } from './ProductionOrderControlButtons';
import { formatCurrencyPHP } from '@/lib/constant';

interface ProductionOrderActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: string;
  onSuccess?: () => Promise<void>;
}

export const ProductionOrderActionDialog: React.FC<ProductionOrderActionDialogProps> = ({
  open,
  onOpenChange,
  productionOrderId,
  onSuccess,
}) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      getProductionOrder(productionOrderId)
        .then((data) => setOrder(data))
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch order'))
        .finally(() => setLoading(false));
    } else {
      setOrder(null);
      setError(null);
    }
  }, [open, productionOrderId]);

  const handleStatusChange = async (action: Status) => {
    if (!order) return;
    setStatusLoading(action);
    setError(null);
    try {
      await updateProductionOrderStatus(order.id, action);
      toast({
        title: 'Status Updated',
        description: `Production order status updated to ${action.toLowerCase().replace('_', ' ')}`,
      });
      if (onSuccess) await onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setStatusLoading(null);
    }
  };

  // Logic for BOM and button enable/disable
  const hasBOM = order?.bom && order.bom.entries && order.bom.entries.length > 0;
  const canStartProduction = order?.status === 'PENDING' && hasBOM;
  const canPauseProduction = order?.status === 'IN_PROGRESS';
  const canCompleteProduction = order?.status === 'IN_PROGRESS';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Production Order Action</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : order ? (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Production Order: {order.product.sku}
              </CardTitle>
              <div className="text-base mt-1">
                {order.product.name} - {order.quantity} units
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Status: <span className="font-semibold">{order.status.toLowerCase().replace('_', ' ')}</span>
              </div>
            </CardHeader>
            <Separator />
            <CardContent>
              {/* BOM/Material Requirements Section */}
              <div className="mb-6">
                <h3 className="font-medium text-muted-foreground mb-2 text-lg">Material Requirements (BOM)</h3>
                {order.bom && order.bom.entries && order.bom.entries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-3 py-2 text-left font-semibold">Material Name</th>
                          <th className="px-3 py-2 text-left font-semibold">SKU</th>
                          <th className="px-3 py-2 text-right font-semibold">Required Qty</th>
                          <th className="px-3 py-2 text-left font-semibold">Unit</th>
                          <th className="px-3 py-2 text-right font-semibold">Cost/Unit</th>
                          <th className="px-3 py-2 text-right font-semibold">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.bom.entries.map((entry: any) => (
                          <tr key={entry.id} className="border-b">
                            <td className="px-3 py-2">{entry.materialName}</td>
                            <td className="px-3 py-2">{entry.materialSku}</td>
                            <td className="px-3 py-2 text-right">{entry.quantityNeeded}</td>
                            <td className="px-3 py-2">{entry.unitOfMeasure}</td>
                            <td className="px-3 py-2 text-right">{formatCurrencyPHP(entry.costPerUnit)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrencyPHP(entry.totalCost)}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold bg-muted/50">
                          <td className="px-3 py-2" colSpan={5}>Total Material Cost</td>
                          <td className="px-3 py-2 text-right">{formatCurrencyPHP(order.bom.totalMaterialCost)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">No bill of materials defined for this product.</div>
                )}
              </div>
              {/* Production Control Buttons (reused) */}
              <ProductionOrderControlButtons
                order={order}
                updating={statusLoading !== null}
                onStart={async () => {
                  setStatusLoading(Status.IN_PROGRESS);
                  setError(null);
                  try {
                    // Use the new validation function to start production
                    const result = await startProductionWithValidation(order.id);
                    toast({
                      title: '✅ Production Started',
                      description: result.message || 'Production order started successfully with role validation',
                    });
                    if (onSuccess) await onSuccess();
                    onOpenChange(false);
                  } catch (err: any) {
                    setError(err?.message || 'Failed to start production');
                    toast({
                      title: '❌ Cannot Start Production',
                      description: err?.message || 'Failed to start production - role assignments may be incomplete',
                      variant: 'destructive',
                    });
                  } finally {
                    setStatusLoading(null);
                  }
                }}
                onPause={async () => {
                  setStatusLoading(Status.PENDING);
                  setError(null);
                  try {
                    await updateProductionOrderStatus(order.id, Status.PENDING);
                    toast({
                      title: 'Status Updated',
                      description: `Production order status updated to pending`,
                    });
                    if (onSuccess) await onSuccess();
                    onOpenChange(false);
                  } catch (err: any) {
                    setError(err?.message || 'Failed to update status');
                    toast({
                      title: 'Error',
                      description: err?.message || 'Failed to update status',
                      variant: 'destructive',
                    });
                  } finally {
                    setStatusLoading(null);
                  }
                }}
                onComplete={async () => {
                  setStatusLoading(Status.COMPLETED);
                  setError(null);
                  try {
                    await updateProductionOrderStatus(order.id, Status.COMPLETED);
                    toast({
                      title: 'Status Updated',
                      description: `Production order status updated to completed`,
                    });
                    if (onSuccess) await onSuccess();
                    onOpenChange(false);
                  } catch (err: any) {
                    setError(err?.message || 'Failed to update status');
                    toast({
                      title: 'Error',
                      description: err?.message || 'Failed to update status',
                      variant: 'destructive',
                    });
                  } finally {
                    setStatusLoading(null);
                  }
                }}
              />
            </CardContent>
          </Card>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}; 