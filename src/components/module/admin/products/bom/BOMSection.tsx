"use client";

import { useEffect, useState } from "react";
import { BOMTable } from "./BOMTable";
import { getBOMForProduct } from "@/lib/actions/bom";
import { ProductBOM } from "@/types/admin/bom";
import { useToast } from "@/hooks/use-toast";

interface BOMSectionProps {
  productId: string;
  productName: string;
}

export function BOMSection({ productId, productName }: BOMSectionProps) {
  const [bom, setBom] = useState<ProductBOM | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBOMData = async () => {
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
  };

  // Initial data fetch
  useEffect(() => {
    fetchBOMData();
  }, [productId]);

  return (
    <div className="mt-6">
      <BOMTable
        productId={productId}
        productName={productName}
        bom={bom}
        onRefresh={fetchBOMData}
        isLoading={loading}
      />
    </div>
  );
}
