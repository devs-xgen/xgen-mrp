// src/components/module/admin/products/bom/EnhancedBOMSection.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { getBOMForProduct } from "@/lib/actions/bom";
import { ProductBOM } from "@/types/admin/bom";
import { useToast } from "@/hooks/use-toast";
import { BOMTable } from "./BOMTable";

interface BOMSectionProps {
  productId: string;
  productName: string;
  currentStock?: number;
  minimumStockLevel?: number;
}

export function BOMSection({
  productId,
  productName,
  currentStock,
  minimumStockLevel,
}: BOMSectionProps) {
  const [bom, setBom] = useState<ProductBOM | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBOMData = useCallback(async () => {
    try {
      setLoading(true);
      const bomData = await getBOMForProduct(productId);
      setBom(bomData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bill of materials",
        variant: "destructive",
      });
      console.error("Error fetching BOM:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  // Initial data fetch
  useEffect(() => {
    fetchBOMData();
  }, [fetchBOMData]);

  return (
    <div className="mt-6">
      <BOMTable
        productId={productId}
        productName={productName}
        bom={bom}
        onRefresh={fetchBOMData}
        isLoading={loading}
        currentStock={currentStock}
        minimumStockLevel={minimumStockLevel}
      />
    </div>
  );
}

