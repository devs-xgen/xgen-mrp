// src/components/module/admin/purchase-orders/purchase-order-detail-sheet.tsx
"use client";

import { PurchaseOrderPrint } from "./purchase-order-print";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PurchaseOrder } from "@/types/admin/purchase-order";
import { Status } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { updatePurchaseOrder } from "@/lib/actions/purchase-order";
import { OrderLinesTable } from "./order-lines-table";

const formSchema = z.object({
  expectedDelivery: z.string(),
  status: z.string(),
  notes: z.string().optional(),
});

interface PurchaseOrderDetailSheetProps {
  purchaseOrder: PurchaseOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function PurchaseOrderDetailSheet({
  purchaseOrder,
  open,
  onOpenChange,
  onSuccess,
}: PurchaseOrderDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expectedDelivery: purchaseOrder.expectedDelivery.toString().split("T")[0],
      status: purchaseOrder.status,
      notes: purchaseOrder.notes || "",
    },
  });

  const { isDirty } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updatePurchaseOrder(purchaseOrder.id, {
        expectedDelivery: new Date(values.expectedDelivery),
        status: values.status as Status,
        notes: values.notes,
      });

      toast({
        title: "Success",
        description: "Purchase order updated successfully",
      });

      setIsEditing(false);
      if (onSuccess) await onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update purchase order",
        variant: "destructive",
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[750px] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <SheetHeader>
              <SheetTitle>Purchase Order {purchaseOrder.poNumber}</SheetTitle>
              <SheetDescription>
                View and manage purchase order details and line items
              </SheetDescription>
            </SheetHeader>

            <Tabs
              defaultValue="details"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="lines">Order Lines</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Supplier Information */}
                <div className="grid gap-2">
                  <h3 className="text-lg font-medium">Supplier Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm text-muted-foreground">
                        {purchaseOrder.supplier.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Code</label>
                      <p className="text-sm text-muted-foreground">
                        {purchaseOrder.supplier.code}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid gap-4">
                  <h3 className="text-lg font-medium">Order Details</h3>

                  {/* Expected Delivery Date */}
                  <FormField
                    control={form.control}
                    name="expectedDelivery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Delivery Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={!isEditing} />
                        </FormControl>
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
                        <Select
                          disabled={!isEditing}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            placeholder="Add notes..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Order Summary */}
                <div className="grid gap-2">
                  <h3 className="text-lg font-medium">Order Summary</h3>
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Order Date:</span>
                      <span>
                        {new Date(purchaseOrder.orderDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Total Amount:</span>
                      <span>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "PHP",
                        }).format(Number(purchaseOrder.totalAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Total Items:</span>
                      <span>{purchaseOrder.orderLines.length}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lines" className="mt-4">
                <div className="grid gap-4">
                  <h3 className="text-lg font-medium">Order Lines</h3>
                  {/* Cast the order lines to the type expected by OrderLinesTable */}
                  <OrderLinesTable
                    orderLines={purchaseOrder.orderLines as any}
                    allowEdit={false}
                  />

                  {/* Order total at the bottom */}
                  <div className="flex justify-end border-t pt-4">
                    <div className="text-right">
                      <div className="font-medium text-muted-foreground">
                        Total Amount:
                      </div>
                      <div className="text-lg font-bold">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "PHP",
                        }).format(Number(purchaseOrder.totalAmount))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <SheetFooter className="pt-4 border-t">
              <div className="flex justify-between w-full">
                <PurchaseOrderPrint purchaseOrder={purchaseOrder} />

                {isEditing ? (
                  <>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.reset();
                          setIsEditing(false);
                        }}
                        className="mr-2"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!isDirty}>
                        Save changes
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Order
                  </Button>
                )}
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
