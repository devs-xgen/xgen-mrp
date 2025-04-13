"use client";

import * as z from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getAvailableCustomerOrders,
  linkCustomerOrderToProduction,
} from "@/lib/actions/production-order";

// Form schema for linking customer order
const linkOrderSchema = z.object({
  customerOrderId: z.string().min(1, "Customer order is required"),
});

interface LinkCustomerOrderDialogProps {
  productionOrderId: string;
  onSuccess?: () => void;
  onRefresh?: () => Promise<void>;
  children?: React.ReactNode;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
  };
  requiredDate: Date;
}

export function LinkCustomerOrderDialog({
  productionOrderId,
  onSuccess,
  children,
  onRefresh,
}: LinkCustomerOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch customer orders when the dialog opens
    if (open) {
      const fetchCustomerOrders = async () => {
        setFetchingOrders(true);
        try {
          const ordersList = await getAvailableCustomerOrders();
          setCustomerOrders(ordersList);
        } catch (error) {
          console.error("Error fetching customer orders:", error);
          toast({
            title: "Error",
            description: "Failed to load customer orders. Please try again.",
            variant: "destructive",
          });
        } finally {
          setFetchingOrders(false);
        }
      };

      fetchCustomerOrders();
    }
  }, [open, toast]);

  const form = useForm<z.infer<typeof linkOrderSchema>>({
    resolver: zodResolver(linkOrderSchema),
  });

  async function onSubmit(values: z.infer<typeof linkOrderSchema>) {
    try {
      setLoading(true);

      if (!productionOrderId) {
        console.error("Missing productionOrderId");
        toast({
          title: "Error",
          description: "Production order ID is required",
          variant: "destructive",
        });
        return;
      }

      await linkCustomerOrderToProduction(
        productionOrderId,
        values.customerOrderId
      );

      setOpen(false);
      form.reset();

      // Call onRefresh if available to get fresh data
      if (onRefresh) await onRefresh();

      toast({
        title: "Success",
        description: "Customer order linked successfully",
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to link customer order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <LinkIcon className="mr-2 h-4 w-4" />
            Link Customer Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Customer Order</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Order</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={fetchingOrders}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            fetchingOrders
                              ? "Loading customer orders..."
                              : "Select a customer order"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fetchingOrders ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </div>
                      ) : customerOrders.length > 0 ? (
                        customerOrders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            <div className="flex flex-col">
                              <span>{order.orderNumber}</span>
                              <span className="text-xs text-muted-foreground">
                                {order.customer.name} | Due:{" "}
                                {format(
                                  new Date(order.requiredDate),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-center p-2">
                          No available customer orders found.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || customerOrders.length === 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Link Order
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
