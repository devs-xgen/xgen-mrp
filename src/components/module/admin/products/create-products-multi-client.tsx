// src/components/module/admin/products/create-products-multi-client.tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, ChevronRight, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CreateProductForm, CreateProductFormRef } from "./create-product-form";
import { createProductsBulk } from "@/lib/actions/product";

export interface CreateProductsMultiClientProps {
  categories: { id: string; name: string }[];
}

type Section = { key: string; open: boolean };

export function CreateProductsMultiClient({ categories }: CreateProductsMultiClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([{ key: crypto.randomUUID(), open: true }]);
  const refs = useRef<CreateProductFormRef[]>([]);

  function addSection() {
    setSections((prev) => {
      const collapsed = prev.map((s) => ({ ...s, open: false }));
      return [...collapsed, { key: crypto.randomUUID(), open: true }];
    });
  }

  function removeSection(index: number) {
    setSections((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      if (copy.length === 0) copy.push({ key: crypto.randomUUID(), open: true });
      return copy;
    });
    refs.current.splice(index, 1);
  }

  async function handleCreateAll() {
    const payloads: any[] = [];
    for (let i = 0; i < sections.length; i++) {
      const payload = await refs.current[i]?.validateAndGetPayload();
      if (!payload) {
        setSections((prev) => prev.map((s, idx) => ({ ...s, open: idx === i })));
        toast({ title: "Validation error", description: `Please complete Product ${i + 1}.`, variant: "destructive" });
        return;
      }
      payloads.push(payload);
    }

    if (payloads.length === 0) {
      toast({ title: "Nothing to create", description: "Please fill at least one product.", variant: "destructive" });
      return;
    }

    const res = await createProductsBulk(payloads);
    if ((res as any)?.success) {
      toast({ title: "Created", description: `Inserted ${(res as any).insertedCount} of ${payloads.length} products` });
      setSections([{ key: crypto.randomUUID(), open: true }]);
      refs.current.forEach((r) => r?.reset());
      router.push("/admin/products");
    } else {
      toast({ title: "Error", description: (res as any)?.error || "Failed to create products", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div key={section.key} className="rounded-md border">
          <Collapsible open={section.open} onOpenChange={(open) => setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, open } : s)))}>
            <div className="flex items-center justify-between p-3 border-b bg-muted/20">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2">
                    {section.open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <span>Product {idx + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                {sections.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeSection(idx)}>
                    <Trash className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>
            <CollapsibleContent>
              <div className="p-4">
                <CreateProductForm
                  ref={(el) => {
                    if (el) refs.current[idx] = el;
                  }}
                  categories={categories}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}

      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={addSection}>
          <Plus className="h-4 w-4 mr-2" /> Add more products
        </Button>
        <Button type="button" onClick={handleCreateAll}>
          Create {sections.length} Product{sections.length > 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
