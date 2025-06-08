"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, RefreshCw, Package, Edit3, AlertTriangle } from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";
import { 
  getProductionBOMForDisplay, 
  adjustProductionBOMQuantity,
  bulkAdjustProductionBOM 
} from "@/lib/actions/production-bom";
import { ProductionBOMForDisplay } from "@/types/admin/production-bom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface ProductionMaterialsManagementProps {
  order: any; // You can type this more specifically if needed
}

// Use the existing type from the types file
type ProductionBOMEntry = ProductionBOMForDisplay;

export function ProductionMaterialsManagement({ order }: ProductionMaterialsManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [productionBOM, setProductionBOM] = useState<ProductionBOMEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProductionBOMEntry | null>(null);
  const [editForm, setEditForm] = useState({
    adjustedQuantity: 0,
    adjustmentReason: "",
  });

  // Fetch ProductionBOM data
  const fetchProductionBOM = async () => {
    try {
      setLoading(true);
      const result = await getProductionBOMForDisplay(order.id);
      if (result.success) {
        setProductionBOM(result.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load production materials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching ProductionBOM:", error);
      toast({
        title: "Error",
        description: "Failed to load production materials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionBOM();
  }, [order.id]);

  // Handle editing a material entry
  const handleEdit = (entry: ProductionBOMEntry) => {
    setEditingEntry(entry);
    setEditForm({
      adjustedQuantity: entry.adjustedQuantity || entry.originalQuantity,
      adjustmentReason: entry.adjustmentReason || "",
    });
  };

  // Handle saving an adjusted entry
  const handleSaveAdjustment = async () => {
    if (!editingEntry) return;

    try {
      setSaving(true);
      
      await adjustProductionBOMQuantity({
        id: editingEntry.id,
        adjustedQuantity: editForm.adjustedQuantity,
        adjustmentReason: editForm.adjustmentReason,
      });

      toast({
        title: "Success",
        description: "Material quantity updated successfully",
      });

      // Refresh the data
      await fetchProductionBOM();
      setEditingEntry(null);
    } catch (error) {
      console.error("Error adjusting material:", error);
      toast({
        title: "Error",
        description: "Failed to update material quantity",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totalOriginalCost = productionBOM.reduce((sum, entry) => sum + entry.originalTotalCost, 0);
  const totalCurrentCost = productionBOM.reduce((sum, entry) => sum + entry.currentTotalCost, 0);
  const totalVariance = totalCurrentCost - totalOriginalCost;
  const adjustedCount = productionBOM.filter(entry => entry.isAdjusted).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Production Order
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Production Materials</h1>
            <p className="text-muted-foreground">
              Production Order: {order.id} - {order.product.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={adjustedCount > 0 ? "destructive" : "secondary"}>
            {adjustedCount} Adjusted
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProductionBOM}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Original Cost</div>
            <div className="text-2xl font-bold">{formatCurrencyPHP(totalOriginalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Current Cost</div>
            <div className="text-2xl font-bold">{formatCurrencyPHP(totalCurrentCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Variance</div>
            <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalVariance >= 0 ? '+' : ''}{formatCurrencyPHP(totalVariance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Production Qty</div>
            <div className="text-2xl font-bold">{order.quantity}</div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Original Qty</TableHead>
                <TableHead className="text-right">Current Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionBOM.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.materialName}</TableCell>
                  <TableCell>{entry.materialSku}</TableCell>
                  <TableCell className="text-right">{entry.originalQuantity}</TableCell>
                  <TableCell className="text-right">
                    <span className={entry.isAdjusted ? 'font-semibold text-orange-600' : ''}>
                      {entry.finalQuantity}
                    </span>
                  </TableCell>
                  <TableCell>{entry.unitOfMeasure}</TableCell>
                  <TableCell className="text-right">{formatCurrencyPHP(entry.unitCost)}</TableCell>
                  <TableCell className="text-right">
                    <span className={entry.isAdjusted ? 'font-semibold text-orange-600' : ''}>
                      {formatCurrencyPHP(entry.currentTotalCost)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.isAdjusted ? (
                      <Badge variant="destructive" className="text-xs">
                        Adjusted
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Original
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Material Quantity</DialogTitle>
            <DialogDescription>
              {editingEntry && (
                <>
                  Adjusting: <strong>{editingEntry.materialName}</strong> ({editingEntry.materialSku})
                  <br />
                  Original quantity: {editingEntry.originalQuantity} {editingEntry.unitOfMeasure}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustedQuantity">New Quantity</Label>
              <Input
                id="adjustedQuantity"
                type="number"
                step="0.001"
                value={editForm.adjustedQuantity}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  adjustedQuantity: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="adjustmentReason">Reason for Adjustment</Label>
              <Textarea
                id="adjustmentReason"
                placeholder="Please provide a reason for this adjustment..."
                value={editForm.adjustmentReason}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  adjustmentReason: e.target.value 
                }))}
              />
            </div>

            {editingEntry && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Cost Impact:</span>
                    <span className="font-medium">
                      {formatCurrencyPHP((editForm.adjustedQuantity - editingEntry.originalQuantity) * editingEntry.unitCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Total Cost:</span>
                    <span className="font-medium">
                      {formatCurrencyPHP(editForm.adjustedQuantity * editingEntry.unitCost)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingEntry(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdjustment}
              disabled={saving || !editForm.adjustmentReason.trim()}
            >
              {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 