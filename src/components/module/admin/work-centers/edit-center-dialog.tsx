"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // If you need a textarea
import { toast } from "@/hooks/use-toast";
import { WorkCenter, Status } from "@prisma/client"; // Import WorkCenter

interface FormData {
  name: string;
  description?: string; // Description is optional
  capacityPerHour?: number; // Capacity is optional and a number
  operatingHours?: number; // Operating Hours is optional and a number
  efficiencyRate?: number; // Efficiency Rate is optional and a number
  status: Status;
}

interface EditWorkCenterDialogProps {
  workCenter: WorkCenter;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function EditWorkCenterDialog({
  workCenter,
  trigger,
  onSuccess,
}: EditWorkCenterDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      name: workCenter.name,
      description: workCenter.description || "",
      capacityPerHour: workCenter.capacityPerHour || undefined, // Use undefined for optional numbers
      operatingHours: workCenter.operatingHours || undefined,
      efficiencyRate: workCenter.efficiencyRate ? parseFloat(workCenter.efficiencyRate.toString()) : undefined, // Parse decimal
      status: workCenter.status,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workcenters/${workCenter.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json(); // Get error details if available
        throw new Error(errorData.message || "Failed to update work center"); // Use more specific error message
      }

      toast({
        title: "Success",
        description: "Work center updated successfully",
      });
      setOpen(false);
      onSuccess?.();
    } catch (error: any) { // Type the error as any
      toast({
        title: "Error",
        description: error.message || "Failed to update work center", // Display potentially more specific error
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Work Center</DialogTitle>
          <DialogDescription>Update the work center details below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Work center name is required" }}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} /> {/* Use Textarea if needed */}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacityPerHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity Per Hour</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} /> {/* Number input */}
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
                    <Input type="number" {...field} /> {/* Number input */}
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
                  <FormLabel>Efficiency Rate</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} /> {/* Decimal input */}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              rules={{ required: "Status is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Work Center"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}