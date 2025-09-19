// src/components/module/admin/materials/create-material-form.tsx
"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Status } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createMaterial, createMaterialsBulk } from "@/lib/actions/materials";
import { MaterialCreateInput } from "@/types/admin/materials";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/global/rich-text-editor";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const materialSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sku: z.string().min(2, "SKU must be at least 2 characters"),
    typeId: z.string().min(1, "Material type is required"),
    unitOfMeasureId: z.string().min(1, "Unit of measure is required"),
    costPerUnit: z
      .string()
      .transform((val) => parseFloat(val || "0"))
      .refine((v) => !isNaN(v) && v >= 0, { message: "Must be a non-negative number" }),
    currentStock: z
      .string()
      .transform((val) => parseInt(val || "0"))
      .refine((v) => !isNaN(v) && v >= 0, { message: "Must be a non-negative integer" }),
    minimumStockLevel: z
      .string()
      .transform((val) => parseInt(val || "0"))
      .refine((v) => !isNaN(v) && v >= 0, { message: "Must be a non-negative integer" }),
    leadTime: z
      .string()
      .transform((val) => parseInt(val || "0"))
      .refine((v) => !isNaN(v) && v >= 0, { message: "Must be a non-negative integer" }),
    supplierId: z.string().min(1, "Supplier is required"),
    notes: z.string().optional(),
    status: z.nativeEnum(Status).default(Status.ACTIVE),
  });

export type MaterialFormInputs = {
  name: string;
  sku: string;
  typeId: string;
  unitOfMeasureId: string;
  costPerUnit: string; // String for the form input
  currentStock: string; // String for the form input
  minimumStockLevel: string; // String for the form input
  leadTime: string; // String for the form input
  supplierId: string;
  notes: string;
  status: Status;
};

export type MaterialFormValues = z.infer<typeof materialSchema>;

export interface CreateMaterialFormProps {
  materialTypes: { id: string; name: string }[];
  unitOfMeasures: { id: string; name: string; symbol: string }[];
  suppliers: { id: string; name: string }[];
  onSuccess?: () => Promise<void> | void;
  redirectPath?: string; // optional path to navigate after success (e.g., "/admin/materials")
  showBatchControls?: boolean; // show batch toggle + UI, defaults to true (standalone)
  hideSubmit?: boolean; // hide submit row (for embedded multi-section usage)
}

export type CreateMaterialFormRef = {
  validateAndGetPayload: () => Promise<MaterialCreateInput | null>;
  reset: () => void;
};

export const CreateMaterialForm = forwardRef<CreateMaterialFormRef, CreateMaterialFormProps>(function CreateMaterialForm(
  {
    materialTypes,
    unitOfMeasures,
    suppliers,
    onSuccess,
    redirectPath,
    showBatchControls = true,
    hideSubmit = false,
  }: CreateMaterialFormProps,
  ref
) {
  const [batchMode, setBatchMode] = useState(false);
  const [batchItems, setBatchItems] = useState<MaterialCreateInput[]>([]);
  const [createAnother, setCreateAnother] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<MaterialFormInputs>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      sku: "",
      costPerUnit: "0",
      currentStock: "0",
      minimumStockLevel: "0",
      leadTime: "0",
      notes: "",
      status: Status.ACTIVE,
    },
  });

  function toPayload(data: MaterialFormInputs): MaterialCreateInput {
    return {
      name: data.name,
      sku: data.sku,
      typeId: data.typeId,
      unitOfMeasureId: data.unitOfMeasureId,
      costPerUnit: Number(data.costPerUnit ?? 0),
      currentStock: Number(data.currentStock ?? 0),
      minimumStockLevel: Number(data.minimumStockLevel ?? 0),
      leadTime: Number(data.leadTime ?? 0),
      supplierId: data.supplierId,
      notes: data.notes,
    };
  }

  useImperativeHandle(ref, () => ({
    async validateAndGetPayload() {
      const isValid = await form.trigger();
      if (!isValid) return null;
      if (skuStatus === "taken") {
        form.setError("sku", { type: "validate", message: "SKU is already taken" });
        return null;
      }
      return toPayload(form.getValues() as any);
    },
    reset() {
      form.reset({
        name: "",
        sku: "",
        costPerUnit: "0",
        currentStock: "0",
        minimumStockLevel: "0",
        leadTime: "0",
        notes: "",
        status: Status.ACTIVE,
      } as any);
    },
  }));

  // Real-time SKU availability check (debounced)
  const [skuStatus, setSkuStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const skuValue = form.watch("sku");
  useEffect(() => {
    let timer: any;
    const v = (skuValue || "").trim();
    if (!v) {
      setSkuStatus("idle");
      return;
    }
    setSkuStatus("checking");
    timer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/check-sku/material?sku=${encodeURIComponent(v)}`);
        const res = await resp.json();
        setSkuStatus(res?.available ? "available" : "taken");
        if (!res?.available) {
          form.setError("sku", { type: "validate", message: "SKU is already taken" });
        } else {
          form.clearErrors("sku");
        }
      } catch (e) {
        setSkuStatus("error");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [skuValue]);

  async function afterSuccess(message: string) {
    toast({ title: "Success", description: message });
    if (onSuccess) await onSuccess();
    if (redirectPath) {
      router.push(redirectPath);
    } else {
      router.refresh();
    }
  }

  async function onSubmit(data: MaterialFormInputs) {
    try {
      const payload: MaterialCreateInput = toPayload(data);
      await createMaterial(payload);

      const lastValues = form.getValues();
      if (createAnother) {
        form.reset({
          name: "",
          sku: "",
          costPerUnit: "0",
          currentStock: "0",
          minimumStockLevel: "0",
          leadTime: "0",
          notes: "",
          status: lastValues.status,
          typeId: lastValues.typeId,
          unitOfMeasureId: lastValues.unitOfMeasureId,
          supplierId: lastValues.supplierId,
        } as any);
        toast({ title: "Created", description: "Material created. You can add another." });
      } else {
        await afterSuccess("Material created successfully");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create material", variant: "destructive" });
    }
  }

  async function handleAddToBatch() {
    const isValid = await form.trigger();
    if (!isValid) return;
    const payload = toPayload(form.getValues() as any);
    setBatchItems((prev) => [...prev, payload]);
    const lastValues = form.getValues();
    form.reset({
      name: "",
      sku: "",
      costPerUnit: "0",
      currentStock: "0",
      minimumStockLevel: "0",
      leadTime: "0",
      notes: "",
      status: lastValues.status,
      typeId: lastValues.typeId,
      unitOfMeasureId: lastValues.unitOfMeasureId,
      supplierId: lastValues.supplierId,
    } as any);
    toast({ title: "Staged", description: "Added material to batch" });
  }

  async function handleSubmitBatch() {
    if (batchItems.length === 0) return;
    const res = await createMaterialsBulk(batchItems);
    if ((res as any)?.success) {
      toast({
        title: "Batch created",
        description: `Inserted ${(res as any).insertedCount} of ${batchItems.length} materials`,
      });
      setBatchItems([]);
      await afterSuccess("Batch created successfully");
    } else {
      toast({ title: "Error", description: (res as any)?.error || "Failed to create materials", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick options (standalone only) */}
      {showBatchControls && (
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2">
            <Checkbox checked={batchMode} onCheckedChange={(v) => setBatchMode(Boolean(v))} />
            <span className="text-sm">Batch create multiple</span>
          </label>
          <label className="flex items-center gap-2 opacity-100">
            <Checkbox
              checked={createAnother}
              disabled={batchMode}
              onCheckedChange={(v) => setCreateAnother(Boolean(v))}
            />
            <span className="text-sm">Create another after submit</span>
          </label>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Material name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="SKU number"
                        {...field}
                        className={
                          skuStatus === "available"
                            ? "border-green-500 focus-visible:ring-green-500"
                            : skuStatus === "taken" || form.formState.errors.sku
                            ? "border-red-500 focus-visible:ring-red-500"
                            : undefined
                        }
                        aria-invalid={!!form.formState.errors.sku}
                      />
                      <span className="pointer-events-none absolute right-2 top-2.5">
                        {skuStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {skuStatus === "available" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {(skuStatus === "taken" || form.formState.errors.sku) && <XCircle className="h-4 w-4 text-red-600" />}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type and Unit */}
            <FormField
              control={form.control}
              name="typeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materialTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitOfMeasureId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measure</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitOfMeasures.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost and Stock */}
            <FormField
              control={form.control}
              name="costPerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Per Unit</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Stock</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minimumStockLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Stock Level</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leadTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Time (days)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supplier */}
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Status).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Additional notes about the material..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showBatchControls && batchMode && (
            <div className="space-y-3">
              <div className="rounded-md border">
                <div className="p-3 text-sm font-medium border-b bg-muted/30">
                  Staged materials ({batchItems.length})
                </div>
                <div className="max-h-48 overflow-auto divide-y">
                  {batchItems.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      No items staged yet. Fill the form and click "Add to Batch".
                    </div>
                  ) : (
                    batchItems.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 text-sm">
                        <div className="truncate">
                          <div className="font-medium truncate">
                            {item.name} <span className="text-muted-foreground">({item.sku})</span>
                          </div>
                          <div className="text-muted-foreground truncate">
                            Stock: {item.currentStock} • Min: {item.minimumStockLevel} • Cost: {item.costPerUnit}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBatchItems(batchItems.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {!hideSubmit && (
            <div className="flex justify-end gap-2">
              {showBatchControls && batchMode ? (
                <>
                  <Button type="button" variant="secondary" onClick={handleAddToBatch}>
                    Add to Batch
                  </Button>
                  <Button type="button" onClick={handleSubmitBatch} disabled={batchItems.length === 0}>
                    Create {batchItems.length || ""} Materials
                  </Button>
                </>
              ) : (
                <Button type="submit">Create Material</Button>
              )}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
});
