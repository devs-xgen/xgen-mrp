// src/components/module/admin/products/variant-edit-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { updateProductVariant, toggleVariantActive, deleteVariant } from "@/lib/actions/product";
import type { ProductVariantWithNumberValues } from "@/types/admin/product";

interface VariantEditDialogProps {
  open: boolean;
  variant: ProductVariantWithNumberValues | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function VariantEditDialog({ open, variant, onOpenChange, onSuccess }: VariantEditDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    sku: "",
    displayName: "",
    sizeName: "" as string | null,
    sizeCode: "" as string | null,
    colorName: "" as string | null,
    colorCode: "" as string | null,
    unitCost: 0,
    sellingPrice: 0,
    minimumStockLevel: 0,
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (open && variant) {
      setForm({
        sku: variant.sku || "",
        displayName: variant.displayName || "",
        sizeName: variant.sizeName ?? null,
        sizeCode: variant.sizeCode ?? null,
        colorName: variant.colorName ?? null,
        colorCode: variant.colorCode ?? null,
        unitCost: Number(variant.unitCost || 0),
        sellingPrice: Number(variant.sellingPrice || 0),
        minimumStockLevel: Number(variant.minimumStockLevel || 0),
        sortOrder: Number(variant.sortOrder || 0),
        isActive: Boolean(variant.isActive),
      });
    }
  }, [open, variant]);

  const handleChange = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!variant) return;
    setSaving(true);
    try {
      const res = await updateProductVariant(variant.id, {
        sku: form.sku,
        displayName: form.displayName,
        sizeName: form.sizeName,
        sizeCode: form.sizeCode,
        colorName: form.colorName,
        colorCode: form.colorCode,
        unitCost: Number(form.unitCost),
        sellingPrice: Number(form.sellingPrice),
        minimumStockLevel: Number(form.minimumStockLevel),
        sortOrder: Number(form.sortOrder),
        isActive: Boolean(form.isActive),
      });
      if (res?.success) {
        toast({ title: "Variant updated" });
        await onSuccess?.();
        onOpenChange(false);
      } else {
        toast({ title: "Update failed", description: res?.error ?? "Unable to update variant.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!variant) return;
    try {
      const res = await toggleVariantActive(variant.id, !form.isActive);
      if (res?.success) {
        setForm(prev => ({ ...prev, isActive: !prev.isActive }));
        toast({ title: res.data?.isActive ? "Variant activated" : "Variant deactivated" });
        await onSuccess?.();
      } else {
        toast({ title: "Failed", description: res?.error ?? "Unable to toggle status", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Something went wrong.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!variant) return;
    if (!confirm("Delete this variant? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await deleteVariant(variant.id);
      if (res?.success) {
        toast({ title: "Variant deleted" });
        await onSuccess?.();
        onOpenChange(false);
      } else {
        toast({ title: "Delete failed", description: res?.error ?? "Unable to delete variant.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Variant</DialogTitle>
          <DialogDescription>Update variant details, pricing, and status.</DialogDescription>
        </DialogHeader>

        {variant && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={form.displayName} onChange={(e) => handleChange("displayName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Size Name</Label>
                <Input value={form.sizeName ?? ""} onChange={(e) => handleChange("sizeName", e.target.value || null)} />
              </div>
              <div className="space-y-2">
                <Label>Size Code</Label>
                <Input value={form.sizeCode ?? ""} onChange={(e) => handleChange("sizeCode", e.target.value || null)} />
              </div>
              <div className="space-y-2">
                <Label>Color Name</Label>
                <Input value={form.colorName ?? ""} onChange={(e) => handleChange("colorName", e.target.value || null)} />
              </div>
              <div className="space-y-2">
                <Label>Color Code</Label>
                <Input value={form.colorCode ?? ""} onChange={(e) => handleChange("colorCode", e.target.value || null)} />
              </div>
              <div className="space-y-2">
                <Label>Unit Cost</Label>
                <Input type="number" step="0.01" value={form.unitCost} onChange={(e) => handleChange("unitCost", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Selling Price</Label>
                <Input type="number" step="0.01" value={form.sellingPrice} onChange={(e) => handleChange("sellingPrice", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Minimum Stock Level</Label>
                <Input type="number" value={form.minimumStockLevel} onChange={(e) => handleChange("minimumStockLevel", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => handleChange("sortOrder", Number(e.target.value))} />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(checked) => handleChange("isActive", checked)} />
                <span>{form.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleToggleActive}>
                  {form.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
