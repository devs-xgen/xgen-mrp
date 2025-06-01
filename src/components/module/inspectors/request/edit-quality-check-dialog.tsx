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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { updateQualityCheck } from "@/lib/actions/quality-checks";
import { Status } from "@prisma/client";
import { getActiveInspectors } from "@/lib/actions/inspector";
import { RichTextEditor } from "@/components/global/rich-text-editor";
import { QualityCheck } from "@/types/admin/quality-checks";

// Form schema for quality check updates
const editQualityCheckSchema = z.object({
  inspectorId: z.string().min(1, "Inspector is required"),
  checkDate: z.date({
    required_error: "Check date is required",
  }),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  defectsFound: z.string().optional(),
  actionTaken: z.string().optional(),
  notes: z.string().optional(),
});

interface EditQualityCheckDialogProps {
  qualityCheck: QualityCheck;
  onRefresh?: () => Promise<void>; // For refreshing data from server
  children?: React.ReactNode;
}

export function EditQualityCheckDialog({
  qualityCheck,
  onRefresh,
  children,
}: EditQualityCheckDialogProps) {
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

  // Initialize the form with existing quality check data
  const form = useForm<z.infer<typeof editQualityCheckSchema>>({
    resolver: zodResolver(editQualityCheckSchema),
    defaultValues: {
      inspectorId: qualityCheck.inspectorId,
      checkDate: new Date(qualityCheck.checkDate),
      status: (qualityCheck.status === "ACTIVE" ? "PENDING" : qualityCheck.status) as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
      defectsFound: qualityCheck.defectsFound || "",
      actionTaken: qualityCheck.actionTaken || "",
      notes: qualityCheck.notes || "",
    },
  });

  async function onSubmit(values: z.infer<typeof editQualityCheckSchema>) {
    try {
      setLoading(true);

      const updateData = {
        id: qualityCheck.id,
        status: values.status,
        defectsFound: values.defectsFound,
        actionTaken: values.actionTaken,
        notes: values.notes,
        inspectorId: values.inspectorId,
        checkDate: values.checkDate,
      };

      await updateQualityCheck(qualityCheck.id, values.status, updateData);
      setOpen(false);

      // Refresh data if callback provided
      if (onRefresh) await onRefresh();

      toast({
        title: "Success",
        description: "Quality check updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update quality check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] h-[95vh] sm:h-auto max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2 sticky top-0 bg-background z-10">
          <DialogTitle>Edit Quality Check</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="inspectorId"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Inspector</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
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
                        <SelectContent className="max-h-[200px]">
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
                    <FormItem className="flex flex-col flex-1">
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
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
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                    <FormLabel>Defects Found</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Describe any defects or issues found..."
                      />
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
                    <FormLabel>Action Taken</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Describe any actions taken to address issues..."
                      />
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
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Add any additional notes about the quality check..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4 sticky bottom-0 bg-background pb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Quality Check
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 