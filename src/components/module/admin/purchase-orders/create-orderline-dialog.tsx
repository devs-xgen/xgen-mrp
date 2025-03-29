// src/components/module/admin/purchase-ordeline/create-orderline-dialog.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPurchaseOrderLine } from "@/lib/actions/purchaseorderline";
import { useToast } from "@/hooks/use-toast";
import { ComboboxField } from "../purchase-orders/combobox-field";
import { RichTextEditor } from "@/components/global/rich-text-editor";

// Form Schema
const formSchema = z.object({
  poId: z.string({
    required_error: "Please select a purchase order",
  }),
  materialId: z.string({
    required_error: "Please select a material",
  }),
  quantity: z
    .number({
      required_error: "Please enter a quantity",
    })
    .min(1, "Quantity must be at least 1"),
  unitPrice: z
    .number({
      required_error: "Please enter a unit price",
    })
    .min(0, "Unit price must be at least 0"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Material {
  id: string;
  name: string;
  sku: string;
  costPerUnit: number;
  currentStock: number;
  unitOfMeasure: {
    symbol: string;
    name: string;
  };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: {
    name: string;
  };
}

interface CreateOrderLineDialogProps {
  materials: Material[];
  purchaseOrders: PurchaseOrder[];
  poId?: string; // Optional pre-selected purchase order ID
  onSuccess: () => Promise<void> | void;
}

export function CreateOrderLineDialog({
  materials,
  purchaseOrders,
  poId,
  onSuccess,
}: CreateOrderLineDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      poId: poId || "",
      materialId: "",
      quantity: 1,
      unitPrice: 0,
      notes: "",
    },
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      form.reset({
        poId: poId || "",
        materialId: "",
        quantity: 1,
        unitPrice: 0,
        notes: "",
      });
    }
  }, [open, form, poId]);

  const handleMaterialSelect = (value: string) => {
    const material = materials.find((m) => m.id === value);
    if (material) {
      form.setValue("materialId", value);
      form.setValue("unitPrice", material.costPerUnit);
    }
  };

  async function onSubmit(values: FormValues) {
    try {
      await addPurchaseOrderLine({
        poId: values.poId,
        materialId: values.materialId,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        notes: values.notes,
      });

      toast({
        title: "Success",
        description: "Order line added successfully",
      });
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add order line",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="mr-2 h-4 w-4" />
          Add Order Line
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Purchase Order Line</DialogTitle>
          <DialogDescription>
            Add a new line item to a purchase order
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!poId && (
              <FormField
                control={form.control}
                name="poId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order</FormLabel>
                    <FormControl>
                      <ComboboxField
                        options={purchaseOrders.map((po) => ({
                          id: po.id,
                          name: `${po.poNumber} - ${po.supplier.name}`,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select purchase order"
                        emptyText="No purchase orders found"
                        createNewPath="/admin/purchase-orders"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <FormControl>
                    <ComboboxField
                      options={materials.map((m) => ({
                        id: m.id,
                        name: `${m.name} (${m.sku})`,
                        code: `Stock: ${m.currentStock} ${m.unitOfMeasure.symbol}`,
                      }))}
                      value={field.value}
                      onValueChange={handleMaterialSelect}
                      placeholder="Select material"
                      emptyText="No materials found"
                      createNewPath="/admin/materials"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
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
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Add Order Line</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
