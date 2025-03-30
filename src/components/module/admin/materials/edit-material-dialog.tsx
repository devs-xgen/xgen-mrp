"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Status } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updateMaterial } from "@/lib/actions/materials";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";

// Schema for form validation
const materialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  typeId: z.string().min(1, "Material type is required"),
  unitOfMeasureId: z.string().min(1, "Unit of measure is required"),
  costPerUnit: z.coerce
    .number()
    .min(0, "Cost per unit must be greater than or equal to 0"),
  currentStock: z.coerce
    .number()
    .int("Current stock must be a whole number")
    .min(0),
  expectedStock: z.coerce
    .number()
    .int("Expected stock must be a whole number")
    .min(0),
  committedStock: z.coerce
    .number()
    .int("Committed stock must be a whole number")
    .min(0),
  calculatedStock: z.coerce
    .number()
    .int("Calculated stock must be a whole number")
    .min(0),
  minimumStockLevel: z.coerce
    .number()
    .int("Minimum stock level must be a whole number")
    .min(0),
  leadTime: z.coerce.number().int("Lead time must be a whole number").min(0),
  supplierId: z.string().min(1, "Supplier is required"),
  notes: z.string().optional(),
  status: z.nativeEnum(Status),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

// Define an interface that matches the expected format for the form
interface Material {
  id: string;
  name: string;
  sku: string;
  typeId: string;
  unitOfMeasureId: string;
  costPerUnit: number; // We expect this as a number, not Decimal
  currentStock: number;
  expectedStock?: number;
  committedStock?: number;
  calculatedStock?: number;
  minimumStockLevel: number;
  leadTime: number;
  supplierId: string;
  status: Status;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
  notes?: string | null;
  // Relations
  supplier?: { id: string; name: string };
  type?: { id: string; name: string };
  unitOfMeasure?: { id: string; name: string; symbol?: string };
  boms?: any[];
  purchaseOrderLines?: any[];
}

interface EditMaterialDialogProps {
  material?: Material;
  materialTypes?: { id: string; name: string }[];
  unitOfMeasures?: { id: string; name: string; symbol?: string }[];
  suppliers?: { id: string; name: string }[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditMaterialDialog({
  material,
  materialTypes = [],
  unitOfMeasures = [],
  suppliers = [],
  open,
  onOpenChange,
  onSuccess,
}: EditMaterialDialogProps) {
  console.log("EditMaterialDialog rendered with props:", {
    materialId: material?.id,
    materialName: material?.name,
    open,
  });

  const [isOpen, setIsOpen] = useState(open || false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  // Update local state when the open prop changes
  useEffect(() => {
    console.log("Open prop changed:", open);
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    console.log("handleOpenChange called with:", newOpen);
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: material
      ? {
          name: material.name,
          sku: material.sku,
          typeId: material.typeId,
          unitOfMeasureId: material.unitOfMeasureId,
          costPerUnit: material.costPerUnit,
          currentStock: material.currentStock,
          expectedStock: material.expectedStock || 0,
          committedStock: material.committedStock || 0,
          calculatedStock: material.calculatedStock || 0,
          minimumStockLevel: material.minimumStockLevel,
          leadTime: material.leadTime,
          supplierId: material.supplierId,
          notes: material.notes || "",
          status: material.status,
        }
      : {
          name: "",
          sku: "",
          typeId: "",
          unitOfMeasureId: "",
          costPerUnit: 0,
          currentStock: 0,
          expectedStock: 0,
          committedStock: 0,
          calculatedStock: 0,
          minimumStockLevel: 0,
          leadTime: 0,
          supplierId: "",
          notes: "",
          status: Status.ACTIVE,
        },
  });

  // Reset form when material changes
  useEffect(() => {
    console.log("Material changed, resetting form:", material?.name);
    if (material) {
      form.reset({
        name: material.name,
        sku: material.sku,
        typeId: material.typeId,
        unitOfMeasureId: material.unitOfMeasureId,
        costPerUnit: material.costPerUnit,
        currentStock: material.currentStock,
        expectedStock: material.expectedStock || 0,
        committedStock: material.committedStock || 0,
        calculatedStock: material.calculatedStock || 0,
        minimumStockLevel: material.minimumStockLevel,
        leadTime: material.leadTime,
        supplierId: material.supplierId,
        notes: material.notes || "",
        status: material.status,
      });
    }
  }, [material, form]);

  async function onSubmit(data: MaterialFormValues) {
    console.log("Form submitted with data:", data);
    try {
      setLoading(true);
      if (!material?.id) {
        throw new Error("Material ID is required for updating");
      }

      await updateMaterial({
        id: material.id,
        ...data,
      });

      console.log("Material updated successfully");
      handleOpenChange(false);
      if (onSuccess) onSuccess();

      toast({
        title: "Success",
        description: "Material updated successfully",
      });
    } catch (error) {
      console.error("Error updating material:", error);
      toast({
        title: "Error",
        description: "Failed to update material",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Calculate the effective stock level
  const effectiveStock =
    form.watch("currentStock") +
    form.watch("expectedStock") -
    form.watch("committedStock");

  // Update calculated stock when dependencies change
  useEffect(() => {
    form.setValue("calculatedStock", effectiveStock);
  }, [
    form.watch("currentStock"),
    form.watch("expectedStock"),
    form.watch("committedStock"),
    form,
    effectiveStock,
  ]);

  // Debug dialog state
  useEffect(() => {
    console.log("Dialog isOpen state:", isOpen);
  }, [isOpen]);

  console.log("Rendering dialog with isOpen:", isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
          <DialogDescription>
            Update the material details below.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pt-4"
            >
              {/* Basic Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* SKU */}
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Material Type */}
                  <FormField
                    control={form.control}
                    name="typeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
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

                  {/* Unit of Measure */}
                  <FormField
                    control={form.control}
                    name="unitOfMeasureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measure</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
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

                  {/* Cost Per Unit */}
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

                  {/* Supplier */}
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
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
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Current Stock */}
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

                  {/* Minimum Stock Level */}
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

                  {/* Expected Stock */}
                  <FormField
                    control={form.control}
                    name="expectedStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Stock</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Stock that is on order but not yet received
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Committed Stock */}
                  <FormField
                    control={form.control}
                    name="committedStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Committed Stock</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Stock already allocated to production orders
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Calculated Stock (Read-only) */}
                  <FormField
                    control={form.control}
                    name="calculatedStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calculated Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            readOnly
                            className="bg-muted"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Current + Expected - Committed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Lead Time */}
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

              {/* Metadata Tab */}
              <TabsContent value="metadata" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(Status).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0) +
                                  status.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Creation/Modification Info */}
                  {material && material.createdAt && (
                    <div className="col-span-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            Audit Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p>
                                {material.createdAt
                                  ? formatDate(material.createdAt)
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Created By
                              </p>
                              <p>{material.createdBy || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Last Updated
                              </p>
                              <p>
                                {material.updatedAt
                                  ? formatDate(material.updatedAt)
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Modified By
                              </p>
                              <p>{material.modifiedBy || "N/A"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about the material..."
                          className="h-32 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Material"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
