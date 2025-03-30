"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BOMEntryForDisplay, ProductBOM } from "@/types/admin/bom";
import { AddMaterialDialog } from "./AddMaterialDialog";
import { EditMaterialDialog } from "./EditMaterialDialog";
import { deleteBOMEntry } from "@/lib/actions/bom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BOMTableProps {
  productId: string;
  productName: string;
  bom: ProductBOM | null;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

export function BOMTable({
  productId,
  productName,
  bom,
  onRefresh,
  isLoading = false,
}: BOMTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<BOMEntryForDisplay | null>(
    null
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleEdit = (entry: BOMEntryForDisplay) => {
    setSelectedEntry(entry);
    setShowEditDialog(true);
  };

  const handleDelete = async (entryId: string) => {
    if (
      confirm("Are you sure you want to remove this material from the BOM?")
    ) {
      try {
        setDeleteLoading(entryId);
        await deleteBOMEntry(entryId);
        await onRefresh();

        toast({
          title: "Material Removed",
          description: "Material has been removed from the bill of materials",
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to remove material",
          variant: "destructive",
        });
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const handleAddSuccess = async () => {
    setShowAddDialog(false);
    await onRefresh();

    toast({
      title: "Material Added",
      description: "Material has been added to the bill of materials",
    });
  };

  const handleEditSuccess = async () => {
    setShowEditDialog(false);
    setSelectedEntry(null);
    await onRefresh();

    toast({
      title: "Material Updated",
      description: "Material specifications have been updated",
    });
  };

  // Format currency as PHP
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const bomEntries = bom?.entries || [];
  const totalMaterialCost = bom?.totalMaterialCost || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bill of Materials</CardTitle>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : bomEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Waste %</TableHead>
                  <TableHead className="text-right">Cost per Unit</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bomEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.materialName}
                    </TableCell>
                    <TableCell>{entry.materialSku}</TableCell>
                    <TableCell>{entry.unitOfMeasure}</TableCell>
                    <TableCell className="text-right">
                      {entry.quantityNeeded.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.wastePercentage.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.costPerUnit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.totalCost)}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        disabled={!!deleteLoading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleteLoading === entry.id}
                      >
                        {deleteLoading === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={6} className="text-right font-bold">
                    Total Material Cost:
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalMaterialCost)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground mb-4">
              No materials have been added to this product.
            </p>
            <Button variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </div>
        )}
      </CardContent>

      {/* Add Material Dialog */}
      <AddMaterialDialog
        productId={productId}
        productName={productName}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Material Dialog */}
      {selectedEntry && (
        <EditMaterialDialog
          entry={selectedEntry}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handleEditSuccess}
        />
      )}
    </Card>
  );
}
