"use client";

import * as z from "zod";
import { useEffect, useState } from "react";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { createQualityCheck } from "@/lib/actions/quality-checks";
import { Status } from "@prisma/client";
import { useParams } from "next/dist/client/components/navigation";
import { getActiveInspectors } from "@/lib/actions/inspector";

// Form schema for basic quality check details
const qualityCheckSchema = z.object({
  inspectorId: z.string().min(1, "Inspector is required"),
  checkDate: z.date({
    required_error: "Check date is required",
  }),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
  defectsFound: z.string().optional(),
  actionTaken: z.string().optional(),
  notes: z.string().optional(),
});

interface CreateQualityCheckDialogProps {
  productionOrderId: string;
  onSuccess?: () => void; // Simplified - just a notification that it succeeded
  onRefresh?: () => Promise<void>; // For refreshing data from server
  inspectors?: {
    inspectorId: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  children?: React.ReactNode;
}

export function CreateQualityCheckDialog({
  productionOrderId: propId,
  onSuccess,
  children,
  onRefresh,
}: CreateQualityCheckDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inspectors, setInspectors] = useState<
    Array<{
      inspectorId: string;
      firstName: string;
      lastName: string;
      email: string;
      department?: string | null;
    }>
  >([]);
  const [fetchingInspectors, setFetchingInspectors] = useState(false);
  const { toast } = useToast();
  const params = useParams();

  const productionOrderId = propId || (params?.id as string);

  useEffect(() => {
    // Fetch inspectors when the dialog opens
    if (open) {
      const fetchInspectors = async () => {
        setFetchingInspectors(true);
        try {
          const inspectorsList = await getActiveInspectors();
          setInspectors(inspectorsList);
        } catch (error) {
          console.error("Error fetching inspectors:", error);
          toast({
            title: "Error",
            description: "Failed to load inspectors. Please try again.",
            variant: "destructive",
          });
        } finally {
          setFetchingInspectors(false);
        }
      };

      fetchInspectors();
    }
  }, [open, toast]);

  const form = useForm<z.infer<typeof qualityCheckSchema>>({
    resolver: zodResolver(qualityCheckSchema),
    defaultValues: {
      status: "PENDING",
    },
  });

  async function onSubmit(values: z.infer<typeof qualityCheckSchema>) {
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

      const qualityCheckData = {
        ...values,
        productionOrderId,
      };

      await createQualityCheck(qualityCheckData);
      setOpen(false);
      form.reset();

      // Simply call onRefresh if available to get fresh data
      if (onRefresh) await onRefresh();

      toast({
        title: "Success",
        description: "Quality check created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create quality check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="default">Create Quality Check</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Quality Check</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inspectorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={fetchingInspectors}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            fetchingInspectors
                              ? "Loading inspectors..."
                              : "Select an inspector"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fetchingInspectors ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </div>
                      ) : inspectors.length > 0 ? (
                        inspectors.map((inspector) => (
                          <SelectItem
                            key={inspector.inspectorId}
                            value={inspector.inspectorId}
                          >
                            <div className="flex flex-col">
                              <span>
                                {inspector.firstName} {inspector.lastName}
                              </span>
                              {inspector.department && (
                                <span className="text-xs text-muted-foreground">
                                  {inspector.department}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-center p-2">
                          No inspectors available. Please add inspectors first.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Check Date</FormLabel>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defectsFound"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Defects Found (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actionTaken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Taken (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
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
              <Button
                type="submit"
                disabled={loading || inspectors.length === 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Quality Check
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
