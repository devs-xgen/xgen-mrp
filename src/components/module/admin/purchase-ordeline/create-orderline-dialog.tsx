"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PurchaseOrderLineSchema, type PurchaseOrderLineFormValues, purchaseOrderLineUpdateSchema } from "@/lib/purchase";
import { Status } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

interface CreatePurchaseOrderLineDialogProps {
  materials: { 
    id: string; 
    name: string; 
    costPerUnit: number | string; 
    currentStock: number | string; 
    minimumStockLevel: number | string; 
  }[];
  onSuccess?: () => Promise<void>;
}

export function CreatePurchaseOrderLineDialog({
  materials,
  onSuccess,
}: CreatePurchaseOrderLineDialogProps) {
  const { toast } = useToast();
  const form = useForm<PurchaseOrderLineFormValues>({
    resolver: zodResolver(purchaseOrderLineUpdateSchema),
    defaultValues: {
      poId: "",
      materialId: "",
      quantity: 1,
      unitPrice: 0,
      status: Status.ACTIVE,
      notes: "",
      createdBy: "admin",
    },
  });

  const [open, setOpen] = useState(false); // State to control dialog open/close

  const onSubmit = async (values: PurchaseOrderLineFormValues) => {
    try {
      const formattedValues = {
        ...values,
        quantity: Number(values.quantity),
        unitPrice: parseFloat(values.unitPrice.toString()),
      };

      const response = await fetch("/api/purchaseOrderline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedValues),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create purchase order line");
      }

      toast({ title: "Success", description: "Purchase order line created successfully" });
      form.reset();
      if (onSuccess) await onSuccess();
      setOpen(false); // Close dialog after successful submission
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create purchase order line",
        variant: "destructive",
      });
    }
  };

  // Ensure materials' costPerUnit is converted to numbers before rendering
  const formattedMaterials = materials.map((material) => ({
    ...material,
    costPerUnit: typeof material.costPerUnit === 'string' 
      ? parseFloat(material.costPerUnit) 
      : material.costPerUnit, // Convert string to number if needed
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}> {/* Controlled dialog */}
      <DialogTrigger asChild>  
        <Button  
          onClick={(e) => {  
            e.stopPropagation();  
            setOpen(true);  
          }}  
        >  
          <Plus className="mr-2 h-4 w-4" /> Add Purchase Order Line  
        </Button>  
      </DialogTrigger>  
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Purchase Order Line</DialogTitle>
          <DialogDescription>Add a new purchase order line.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="poId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Order ID</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formattedMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
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
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </Select>
                    <SelectContent>
                      <SelectItem value={Status.ACTIVE}>Active</SelectItem>
                      <SelectItem value={Status.INACTIVE}>Inactive</SelectItem>
                    </SelectContent>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Create</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
