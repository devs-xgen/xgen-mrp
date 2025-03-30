// src/components/module/admin/production/add-operation-dialog.tsx (Fixed Version)
"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { addOperation } from "@/lib/actions/production-order";

interface WorkCenter {
  id: string;
  name: string;
  capacityPerHour: number;
}

const formSchema = z
  .object({
    workCenterId: z.string({
      required_error: "Please select a work center",
    }),
    startTime: z.date({
      required_error: "Start time is required",
    }),
    endTime: z
      .date({
        required_error: "End time is required",
      })
      .min(new Date(), "End time must be in the future"),
    cost: z.coerce
      .number({
        required_error: "Cost is required",
      })
      .min(0, "Cost must be a positive number"),
    notes: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

interface AddOperationDialogProps {
  workCenters: WorkCenter[];
  productionOrderId: string;
  onOperationAdded?: () => Promise<void>;
  children?: React.ReactNode;
}

export function AddOperationDialog({
  workCenters,
  productionOrderId,
  onOperationAdded,
  children,
}: AddOperationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cost: 0.0,
    },
  });

  const handleWorkCenterChange = (value: string) => {
    // Optional: You could calculate an estimated cost based on the work center
    // For example, using the capacity per hour and the time difference to estimate labor costs
    const workCenter = workCenters.find((wc) => wc.id === value);
    if (workCenter) {
      const startTime = form.getValues("startTime");
      const endTime = form.getValues("endTime");

      if (startTime && endTime) {
        const hoursDiff =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        // This is a very basic calculation - adjust based on your business logic
        const estimatedCost = parseFloat((hoursDiff * 10).toFixed(2)); // Example: $10 per hour
        form.setValue("cost", estimatedCost);
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      await addOperation(productionOrderId, values);

      setOpen(false);
      form.reset();
      if (onOperationAdded) await onOperationAdded();

      toast({
        title: "Operation Added",
        description: "Successfully added new operation to production order",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add operation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="default">Add Operation</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Operation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="workCenterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Center</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleWorkCenterChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a work center" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workCenters.map((workCenter) => (
                        <SelectItem key={workCenter.id} value={workCenter.id}>
                          <div className="flex flex-col">
                            <span>{workCenter.name}</span>
                            <span className="text-xs text-muted-foreground">
                              Capacity: {workCenter.capacityPerHour} units/hour
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            if (date && form.getValues("workCenterId")) {
                              handleWorkCenterChange(
                                form.getValues("workCenterId")
                              );
                            }
                          }}
                          disabled={(date) =>
                            date < form.getValues("startTime") ||
                            !form.getValues("startTime")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Cost</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Estimated cost for this operation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
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
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Operation
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
