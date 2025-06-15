"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SimpleCreateProductDialog } from "./simple-create-product-dialog";
import type { ProductCategory } from "@prisma/client";

interface CreateProductButtonProps {
  categories: ProductCategory[];
  onSuccess?: () => Promise<void>;
}

export function CreateProductButton({
  categories,
  onSuccess,
}: CreateProductButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = async (product: any) => {
    setOpen(false);
    await onSuccess?.();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Product
      </Button>
      
      <SimpleCreateProductDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </>
  );
} 