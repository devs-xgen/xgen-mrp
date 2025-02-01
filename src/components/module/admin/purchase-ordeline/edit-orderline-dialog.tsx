"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  // DialogFooter,
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
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updatePurchaseOrderline } from "@/lib/actions/purchaseorderline";

interface Material {
  id: string;
  name: string;
}

interface PurchaseOrderLine {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
}

// Edit Purchase Order Line Dialog
interface EditPurchaseOrderLineDialogProps {
  orderLine: PurchaseOrderLine;
  materials: Material[];
  onSuccess?: () => Promise<void>;
  trigger?: React.ReactNode;
}

export function EditPurchaseOrderLineDialog({ orderLine, materials, onSuccess, trigger }: EditPurchaseOrderLineDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<PurchaseOrderLine>({
    defaultValues: orderLine,
  });

  const onSubmit = async (values: PurchaseOrderLine) => {
    try {
      await updatePurchaseOrderline(values);
      toast({ title: "Success", description: "Purchase order line updated successfully" });
      setOpen(false);
      if (onSuccess) await onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update purchase order line", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Purchase Order Line</DialogTitle>
          <DialogDescription>Modify the details of this purchase order line.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Update</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
