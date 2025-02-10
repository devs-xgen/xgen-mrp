"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { WorkCenter, Status } from "@prisma/client";
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
import { workCenterSchema, type WorkCenterFormValues } from "@/lib/workcenter";
import { useToast } from "@/hooks/use-toast";

interface CreateWorkCenterDialogProps {
  workCenterTypes: WorkCenter[];
  onSuccess?: () => Promise<void>;
  trigger?: React.ReactNode;
}

export function CreateWorkCenterDialog({
  workCenterTypes,
  onSuccess,
  trigger,
}: CreateWorkCenterDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<WorkCenterFormValues>({
    resolver: zodResolver(workCenterSchema),
    defaultValues: {
      name: "",
      description: "",
      capacityPerHour: 0,
      operatingHours: 0,
      efficiencyRate: 0,
      status: Status.ACTIVE,
    },
  });

  const onSubmit = async (values: WorkCenterFormValues) => {
    try {
      setIsLoading(true);

      const formattedValues = {
        ...values,
        capacityPerHour: Number(values.capacityPerHour),
        operatingHours: Number(values.operatingHours),
        efficiencyRate: Number(values.efficiencyRate),
      };

      const response = await fetch("/api/work-centers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create work center");
      }

      toast({
        title: "Success",
        description: "Work center created successfully",
      });

      form.reset();
      setOpen(false);
      if (onSuccess) await onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create work center",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Work Center
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[800px] h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background pt-4 pb-2 border-b">
          <DialogTitle>Create Work Center</DialogTitle>
          <DialogDescription>Add a new work center to your system</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="create-workcenter-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter work center name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Operations</h3>
              <div className="grid grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="capacityPerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity Per Hour</FormLabel>
                      <FormControl>
                        <Input type="number"  placeholder="Enter capacity per hour"
          {...field}
          onChange={(e) => field.onChange(Number(e.target.value))}
          className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="operatingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating Hours</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter operating hours"
          {...field}
          onChange={(e) => field.onChange(Number(e.target.value))}
          className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="efficiencyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Efficiency Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter efficiency rate"
          {...field}
          onChange={(e) => field.onChange(Number(e.target.value))}
          className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Work Center"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
