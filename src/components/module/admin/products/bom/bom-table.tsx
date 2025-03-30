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
import { Pencil, Trash, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BOMEntryForDisplay } from "@/types/admin/bom";
import { AddMaterialDialog } from "./add-material-dialog";
import { EditMaterialDialog } from "./edit-material-dialog";
import { deleteBOMEntry } from "@/lib/actions/bom";

interface BOMTableProps {
  productId: string;
  bomEntries: BOMEntryForDisplay[];
  onRefresh: () => Promise<void>;
}

export function BOMTable({ productId, bomEntries, onRefresh }: BOMTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<BOMEntryForDisplay | null>(
    null
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
        setIsDeleting(true);
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
        setIsDeleting(false);
      }
    }
  };

  const handleAddSuccess = async () => {
    setShowAddDialog(false);
    await onRefresh();
  };

  const handleEditSuccess = async () => {
    setShowEditDialog(false);
    setSelectedEntry(null);
    await onRefresh();
  };

  // Calculate total material cost
  const totalCost = bomEntries.reduce((sum, entry) => sum + entry.totalCost, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Bill of Materials</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      {bomEntries.length > 0 ? (
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
                <TableCell>{entry.materialName}</TableCell>
                <TableCell>{entry.materialSku}</TableCell>
                <TableCell>{entry.unitOfMeasure}</TableCell>
                <TableCell className="text-right">
                  {entry.quantityNeeded.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {entry.wastePercentage.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right">
                  ${entry.costPerUnit.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${entry.totalCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      disabled={isDeleting}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={5} className="text-right font-bold">
                Total Material Cost:
              </TableCell>
              <TableCell colSpan={3} className="text-right font-bold">
                ${totalCost.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">
            No materials have been added to this product.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>
      )}

      {/* Add Material Dialog */}
      <AddMaterialDialog
        productId={productId}
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
    </div>
  );
}
