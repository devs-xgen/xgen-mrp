// src/components/module/admin/work-centers/create-work-center-dialog.tsx
"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Status } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkCenter } from "@/types/admin/work-center";
import { createWorkCenter, updateWorkCenter } from "@/lib/actions/work-center";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  capacityPerHour: z.coerce.number().min(1, "Capacity must be at least 1"),
  operatingHours: z.coerce
    .number()
    .min(1, "Operating hours must be at least 1"),
  efficiencyRate: z.coerce
    .number()
    .min(0)
    .max(100, "Efficiency rate must be between 0 and 100"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

interface WorkCenterDialogProps {
  workCenter?: WorkCenter;
  children?: React.ReactNode;
  onSuccess?: () => Promise<void>;
}

export function WorkCenterDialog({
  workCenter,
  children,
  onSuccess,
}: WorkCenterDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const isEditing = !!workCenter;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workCenter?.name || "",
      description: workCenter?.description || "",
      capacityPerHour: workCenter?.capacityPerHour || 1,
      operatingHours: workCenter?.operatingHours || 8,
      efficiencyRate: workCenter?.efficiencyRate ? Number(workCenter.efficiencyRate) : 100,
      status: (workCenter?.status === "ACTIVE" || workCenter?.status === "INACTIVE")
            ? workCenter?.status
            : "ACTIVE",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditing) {
        await updateWorkCenter({
          id: workCenter.id,
          ...values,
        });
      } else {
        await createWorkCenter(values);
      }

      setOpen(false);
      form.reset();
      if (onSuccess) await onSuccess();

      toast({
        title: `Work Center ${isEditing ? "Updated" : "Created"}`,
        description: `Successfully ${
          isEditing ? "updated" : "created"
        } work center "${values.name}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="default">
            {isEditing ? "Edit Work Center" : "Add Work Center"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Work Center" : "Create Work Center"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
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
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacityPerHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity Per Hour</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="efficiencyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Efficiency Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
