// src/components/module/admin/products/create-product-form.tsx
"use client";

import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const productSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sku: z.string().min(1, "SKU is required"),
    description: z.string().optional().default(""),
    categoryId: z.string().min(1, "Category is required"),
    unitCost: z
      .string()
      .transform((v) => parseFloat(v || "0"))
      .refine((v) => !isNaN(v) && v >= 0, { message: "Must be a non-negative number" }),
    sellingPrice: z
      .string()
      .transform((v) => parseFloat(v || "0"))
      .refine((v) => !isNaN(v) && v >= 0, { message: "Must be a non-negative number" }),
    minimumStockLevel: z
      .string()
      .transform((v) => parseInt(v || "0"))
      .refine((v) => !isNaN(v) && v >= 0, { message: "Must be a non-negative integer" }),
    currentStock: z
      .string()
      .transform((v) => parseInt(v || "0"))
      .refine((v) => !isNaN(v) && v >= 0, { message: "Must be a non-negative integer" }),
    leadTime: z
      .string()
      .transform((v) => parseInt(v || "0"))
      .refine((v) => !isNaN(v) && v >= 1, { message: "Must be at least 1 day" }),
    status: z.nativeEnum(Status).default(Status.ACTIVE),
    hasVariants: z.boolean().default(false),
    sizes: z.array(z.string()).default([]),
    colors: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.hasVariants) {
      if (!data.sizes || data.sizes.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one size",
          path: ["sizes"],
        });
      }
      if (!data.colors || data.colors.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one color",
          path: ["colors"],
        });
      }
    }
  });

export type ProductFormInputs = {
  name: string;
  sku: string;
  description?: string;
  categoryId: string;
  unitCost: string;
  sellingPrice: string;
  minimumStockLevel: string;
  currentStock: string;
  leadTime: string;
  status: Status;
  hasVariants: boolean;
  sizes: string[];
  colors: string[];
};

export interface ProductCreatePayload {
  name: string;
  sku: string;
  description?: string;
  categoryId: string;
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
  currentStock: number;
  leadTime: number;
  status?: Status;
  hasVariants?: boolean;
  sizes?: string[];
  colors?: string[];
}

export interface CreateProductFormProps {
  categories: { id: string; name: string }[];
}

export type CreateProductFormRef = {
  validateAndGetPayload: () => Promise<ProductCreatePayload | null>;
  reset: () => void;
};

export const CreateProductForm = forwardRef<CreateProductFormRef, CreateProductFormProps>(
  function CreateProductForm({ categories }, ref) {
    const form = useForm<ProductFormInputs>({
      resolver: zodResolver(productSchema),
      defaultValues: {
        name: "",
        sku: "",
        description: "",
        categoryId: "",
        unitCost: "0",
        sellingPrice: "0",
        minimumStockLevel: "0",
        currentStock: "0",
        leadTime: "7",
        status: Status.ACTIVE,
        hasVariants: false,
        sizes: [],
        colors: [],
      },
    });

    const [sizeInput, setSizeInput] = useState("");
    const [colorInput, setColorInput] = useState("");
    const [activeTab, setActiveTab] = useState("basic");
    const [skuStatus, setSkuStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");

    // Real-time debounced SKU availability check
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
          const resp = await fetch(`/api/check-sku/product?sku=${encodeURIComponent(v)}`);
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

    function toPayload(data: ProductFormInputs): ProductCreatePayload {
      return {
        name: data.name,
        sku: data.sku,
        description: data.description,
        categoryId: data.categoryId,
        unitCost: Number(data.unitCost || 0),
        sellingPrice: Number(data.sellingPrice || 0),
        minimumStockLevel: Number(data.minimumStockLevel || 0),
        currentStock: Number(data.currentStock || 0),
        leadTime: Number(data.leadTime || 0),
        status: data.status,
        hasVariants: data.hasVariants,
        sizes: data.sizes,
        colors: data.colors,
      };
    }

    useImperativeHandle(ref, () => ({
      async validateAndGetPayload() {
        const isValid = await form.trigger();
        if (!isValid) {
          const errors = form.formState.errors as any;
          const hasBasic = errors.name || errors.sku || errors.description || errors.categoryId || errors.status;
          const hasPricing = errors.unitCost || errors.sellingPrice || errors.currentStock || errors.minimumStockLevel || errors.leadTime;
          const hasVariants = errors.hasVariants || errors.sizes || errors.colors;
          if (hasBasic) setActiveTab("basic");
          else if (hasPricing) setActiveTab("pricing");
          else if (hasVariants) setActiveTab("variants");
          return null;
        }
        if (skuStatus === "taken") {
          setActiveTab("basic");
          form.setError("sku", { type: "validate", message: "SKU is already taken" });
          return null;
        }
        return toPayload(form.getValues() as any);
      },
      reset() {
        form.reset({
          name: "",
          sku: "",
          description: "",
          categoryId: "",
          unitCost: "0",
          sellingPrice: "0",
          minimumStockLevel: "0",
          currentStock: "0",
          leadTime: "7",
          status: Status.ACTIVE,
          hasVariants: false,
          sizes: [],
          colors: [],
        } as any);
        setActiveTab("basic");
      },
    }));

    return (
      <Form {...form}>
        <form className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Premium Cotton T-Shirt" {...field} />
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
                            placeholder="e.g., TSHIRT-001"
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
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Describe your product..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Status).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <FormLabel>Minimum Stock</FormLabel>
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
              </div>
            </TabsContent>

            <TabsContent value="variants" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Product Variants</h3>
                  <p className="text-sm text-muted-foreground">Enable variants to create different sizes and colors</p>
                </div>
                <FormField
                  control={form.control}
                  name="hasVariants"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Enable Variants</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("hasVariants") && (
                <div className="space-y-6">
                  <Separator />

                  {/* Sizes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Sizes</h4>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("sizes", Array.from(new Set([...(form.getValues("sizes") || []), "XS","S","M","L","XL","XXL"])))}>
                          Add Clothing Sizes
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} placeholder="Enter size (e.g., M, L, XL)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (sizeInput.trim()) { const v = sizeInput.trim().toUpperCase(); const sizes = form.getValues("sizes") || []; if (!sizes.includes(v)) form.setValue("sizes", [...sizes, v]); setSizeInput(""); } } }} />
                      <Button type="button" onClick={() => { if (sizeInput.trim()) { const v = sizeInput.trim().toUpperCase(); const sizes = form.getValues("sizes") || []; if (!sizes.includes(v)) form.setValue("sizes", [...sizes, v]); setSizeInput(""); } }} size="icon" variant="outline"><Plus className="h-4 w-4" /></Button>
                    </div>

                    {(form.watch("sizes") || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.watch("sizes").map((s, idx) => (
                          <Badge key={idx} variant="secondary" className="gap-2">{s}<button type="button" onClick={() => form.setValue("sizes", (form.getValues("sizes") || []).filter((it) => it !== s))} className="hover:bg-destructive hover:text-destructive-foreground rounded-full"><X className="h-3 w-3" /></button></Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Colors */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Colors</h4>
                    </div>
                    <div className="flex gap-2">
                      <Input value={colorInput} onChange={(e) => setColorInput(e.target.value)} placeholder="Enter color (e.g., Red, Blue)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (colorInput.trim()) { const v = colorInput.trim(); const colors = form.getValues("colors") || []; if (!colors.includes(v)) form.setValue("colors", [...colors, v]); setColorInput(""); } } }} />
                      <Button type="button" onClick={() => { if (colorInput.trim()) { const v = colorInput.trim(); const colors = form.getValues("colors") || []; if (!colors.includes(v)) form.setValue("colors", [...colors, v]); setColorInput(""); } }} size="icon" variant="outline"><Plus className="h-4 w-4" /></Button>
                    </div>
                    {(form.watch("colors") || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.watch("colors").map((c, idx) => (
                          <Badge key={idx} variant="secondary" className="gap-2">{c}<button type="button" onClick={() => form.setValue("colors", (form.getValues("colors") || []).filter((it) => it !== c))} className="hover:bg-destructive hover:text-destructive-foreground rounded-full"><X className="h-3 w-3" /></button></Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    );
  }
);
