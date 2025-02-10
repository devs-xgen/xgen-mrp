"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash } from "lucide-react";
import { WorkCenter, Status } from "@prisma/client"; // Import WorkCenter and Status

interface WorkCenterFormData {
  name: string;
  description?: string;
  capacityPerHour?: number;
  operatingHours?: number;
  efficiencyRate?: number;
  status: Status;
}

interface WorkCenterManagementProps {
  workCenters: WorkCenter[]; // Use WorkCenter type
  onSuccess?: () => void;
}

export function WorkCenterManagement({
  workCenters,
  onSuccess,
}: WorkCenterManagementProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingWorkCenter, setEditingWorkCenter] = useState<WorkCenter | null>(null);

  const form = useForm<WorkCenterFormData>({
    defaultValues: {
      name: "",
      description: "",
      capacityPerHour: undefined,
      operatingHours: undefined,
      efficiencyRate: undefined,
      status: "ACTIVE",
    },
  });

  const onSubmit = async (data: WorkCenterFormData) => {
    try {
      setLoading(true);
      const url = editingWorkCenter
        ? `/api/workcenters/${editingWorkCenter.id}`
        : "/api/workcenters";
      const method = editingWorkCenter ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json(); // Get error details if available
        throw new Error(errorData.message || (editingWorkCenter ? "Failed to update work center" : "Failed to create work center"));
      }

      toast({
        title: "Success",
        description: editingWorkCenter
          ? "Work center updated successfully"
          : "Work center created successfully",
      });
      form.reset();
      setEditingWorkCenter(null);
      onSuccess?.();
    } catch (error: any) { // Type the error as any
      toast({
        title: "Error",
        description: error.message || "Something went wrong", // Display potentially more specific error
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workCenter: WorkCenter) => {
    setEditingWorkCenter(workCenter);
    form.reset({
      name: workCenter.name,
      description: workCenter.description || "",
      capacityPerHour: workCenter.capacityPerHour || undefined,
      operatingHours: workCenter.operatingHours || undefined,
      efficiencyRate: workCenter.efficiencyRate ? parseFloat(workCenter.efficiencyRate.toString()) : undefined,
      status: workCenter.status || "ACTIVE",
    });
  };

  const handleDelete = async (workCenterId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workcenters/${workCenterId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json(); // Get error details if available
        throw new Error(errorData.message || "Failed to delete work center");
      }

      toast({
        title: "Success",
        description: "Work center deleted successfully",
      });
      onSuccess?.();
    } catch (error: any) { // Type the error as any
      toast({
        title: "Error",
        description: error.message || "Failed to delete work center",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Manage Work Centers
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Work Center Management</SheetTitle>
          <SheetDescription>Create and manage your work centers.</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Work center name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Work center name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Work center description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Capacity Per Hour */}
              <FormField
                control={form.control}
                name="capacityPerHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity Per Hour</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Capacity per hour" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Operating Hours */}
              <FormField
                control={form.control}
                name="operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating Hours</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Operating hours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Efficiency Rate */}
              <FormField
                control={form.control}
                name="efficiencyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Efficiency Rate</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Efficiency rate" {...field} />
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
                    <FormControl>
                      <Input placeholder="Work center status" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingWorkCenter
                  ? "Update Work Center"
                  : "Create Work Center"}
              </Button>
            </form>
          </Form>
        </div>

      <Separator className="my-6" />

      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workCenters.map((workCenter) => (
              <TableRow key={workCenter.id}>
                <TableCell className="font-medium">{workCenter.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={workCenter.status === "ACTIVE" ? "default" : "secondary"}
                  >
                    {workCenter.status.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(workCenter)}
                      disabled={loading}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(workCenter.id)}
                      disabled={loading}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SheetContent>
  </Sheet>
);
}