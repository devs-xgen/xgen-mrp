"use client";

import { useState } from "react";
import { MaterialInventoryTable } from "./MaterialInventoryTable";
import { MaterialDetailsDialog } from "./MaterialDetailsDialog";
import type { MaterialInventoryItem } from "@/lib/actions/worker/inventory";

interface MaterialInventoryClientProps {
  materials: MaterialInventoryItem[];
  materialTypes: Array<{ id: string; name: string; description?: string }>;
  suppliers: Array<{ id: string; name: string; code: string }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  currentFilters: {
    search?: string;
    materialType?: string;
    stockLevel?: string;
    supplierId?: string;
  };
}

export function MaterialInventoryClient({
  materials,
  materialTypes,
  suppliers,
  pagination,
  currentFilters,
}: MaterialInventoryClientProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialInventoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewMaterial = (material: MaterialInventoryItem) => {
    setSelectedMaterial(material);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Clear selection after dialog closes
      setTimeout(() => setSelectedMaterial(null), 200);
    }
  };

  return (
    <>
      <MaterialInventoryTable
        materials={materials}
        materialTypes={materialTypes}
        suppliers={suppliers}
        pagination={pagination}
        currentFilters={currentFilters}
        onViewMaterial={handleViewMaterial}
      />

      <MaterialDetailsDialog
        material={selectedMaterial}
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
      />
    </>
  );
}
