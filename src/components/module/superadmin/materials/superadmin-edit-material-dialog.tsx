"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Status } from "@prisma/client";
import { useRouter } from "next/navigation";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Material,
  MaterialType,
  UnitOfMeasure,
  Supplier,
} from "@/types/admin/materials";
import { updateMaterialForSuperAdmin } from "@/lib/actions/superadmin/materials";
import { formatDate } from "@/lib/utils";

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

interface SuperAdminEditMaterialDialogProps {
  material?: Material;
  materialTypes?: MaterialType[];
  unitOfMeasures?: UnitOfMeasure[];
  suppliers?: Supplier[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export function SuperAdminEditMaterialDialog({
  material,
  materialTypes = [],
  unitOfMeasures = [],
  suppliers = [],
  open,
  onOpenChange,
  onSuccess,
}: SuperAdminEditMaterialDialogProps) {
  const [isOpen, setIsOpen] = useState(open ?? false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();
  const router = useRouter();

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
          expectedStock: material.expectedStock ?? 0,
          committedStock: material.committedStock ?? 0,
          calculatedStock:
            material.calculatedStock ??
            (material.currentStock ?? 0) - (material.committedStock ?? 0),
          minimumStockLevel: material.minimumStockLevel,
          leadTime: material.leadTime,
          supplierId: material.supplierId,
          notes: material.notes ?? "",
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

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  useEffect(() => {
    if (!material) return;
    form.reset({
      name: material.name,
      sku: material.sku,
      typeId: material.typeId,
      unitOfMeasureId: material.unitOfMeasureId,
      costPerUnit: material.costPerUnit,
      currentStock: material.currentStock,
      expectedStock: material.expectedStock ?? 0,
      committedStock: material.committedStock ?? 0,
      calculatedStock:
        material.calculatedStock ??
        (material.currentStock ?? 0) - (material.committedStock ?? 0),
      minimumStockLevel: material.minimumStockLevel,
      leadTime: material.leadTime,
      supplierId: material.supplierId,
      notes: material.notes ?? "",
      status: material.status,
    });
  }, [material, form]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      const calculated =
        Number(values.currentStock ?? 0) +
        Number(values.expectedStock ?? 0) -
        Number(values.committedStock ?? 0);
      form.setValue("calculatedStock", calculated);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleOpenChange = (value: boolean) => {
    setIsOpen(value);
    onOpenChange?.(value);
  };

  const onSubmit = async (values: MaterialFormValues) => {
    if (!material?.id) {
      toast({
        title: "Material not found",
        description: "Unable to update the selected material.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await updateMaterialForSuperAdmin({
        id: material.id,
        ...values,
      });

      toast({
        title: "Material updated",
        description: `${material.name} has been updated successfully.`,
      });

      handleOpenChange(false);
      await onSuccess?.();
      router.refresh();
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Unable to update material.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
          <DialogDescription>Update the material details below.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

                  <FormField
                    control={form.control}
                    name="typeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
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

                  <FormField
                    control={form.control}
                    name="unitOfMeasureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measure</FormLabel>
                        <Select
                          onValueChange={field.onChange}
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
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <Select
                          onValueChange={field.onChange}
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormDescription>
                        Provide any additional context about this material.
                      </FormDescription>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock Levels</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
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
                      name="expectedStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Stock</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="committedStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Committed Stock</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="calculatedStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calculated Stock</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            Auto-calculated as Current + Expected - Committed.
                          </FormDescription>
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                            {Object.values(Status).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {material && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Audit Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <div className="font-medium">Created</div>
                        <div>{formatDate(material.createdAt)}</div>
                      </div>
                      <div>
                        <div className="font-medium">Last Updated</div>
                        <div>{formatDate(material.updatedAt)}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
