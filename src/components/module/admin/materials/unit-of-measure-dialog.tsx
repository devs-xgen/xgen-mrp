// src/components/module/admin/materials/unit-of-measure-dialog.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ruler, Pencil, Trash, Loader2 } from "lucide-react";
import { UnitOfMeasure, Status } from "@prisma/client";
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
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUnitOfMeasure,
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
} from "@/lib/actions/unit-of-measure";

const unitOfMeasureSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters"),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
});

type UnitOfMeasureFormValues = z.infer<typeof unitOfMeasureSchema>;

interface UnitOfMeasureDialogProps {
  unitOfMeasures: UnitOfMeasure[];
  onSuccess?: () => Promise<void>;
}

export function UnitOfMeasureDialog({
  unitOfMeasures,
  onSuccess,
}: UnitOfMeasureDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
  const { toast } = useToast();

  const form = useForm<UnitOfMeasureFormValues>({
    resolver: zodResolver(unitOfMeasureSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      status: Status.ACTIVE,
    },
  });

  // In your UnitOfMeasureDialog component, modify the onSubmit function:
  const onSubmit = async (values: UnitOfMeasureFormValues) => {
    try {
      setIsLoading(true);

      if (editingUnit) {
        await updateUnitOfMeasure(editingUnit.id, {
          name: values.name,
          symbol: values.symbol,
          description: values.description,
          status: values.status,
        });
      } else {
        await createUnitOfMeasure({
          name: values.name,
          symbol: values.symbol,
          description: values.description,
          status: values.status,
        });
      }

      toast({
        title: "Success",
        description: `Unit of measure ${
          editingUnit ? "updated" : "created"
        } successfully`,
      });

      form.reset();
      setEditingUnit(null);
      setOpen(false);
      if (onSuccess) await onSuccess();
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save unit of measure",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEdit = (unit: UnitOfMeasure) => {
    setEditingUnit(unit);
    form.reset({
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description || "",
      status: unit.status,
    });
  };

  const onDelete = async (unit: UnitOfMeasure) => {
    if (!confirm("Are you sure you want to delete this unit of measure?"))
      return;

    try {
      setIsLoading(true);
      await deleteUnitOfMeasure(unit.id);

      toast({
        title: "Success",
        description: "Unit of measure deleted successfully",
      });

      if (onSuccess) await onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete unit of measure. It might be in use.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: Status | null | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status) {
      case Status.ACTIVE:
        return "bg-green-100 text-green-800";
      case Status.INACTIVE:
        return "bg-gray-100 text-gray-800";
      case Status.SUSPENDED:
        return "bg-yellow-100 text-yellow-800";
      case Status.ARCHIVED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (status: Status | null | undefined) => {
    if (!status) return "Unknown";
    return (
      status.toString().charAt(0).toUpperCase() +
      status.toString().slice(1).toLowerCase()
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Ruler className="h-4 w-4 mr-2" />
          Units of Measure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage Units of Measure</DialogTitle>
          <DialogDescription>
            Create and manage units of measure for materials
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[400px,1fr] gap-6">
          {/* Form Section - Left Side */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-medium">
              {editingUnit ? "Edit Unit of Measure" : "Add New Unit of Measure"}
            </h3>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter name"
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., kg, m, pcs"
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter description"
                          className="resize-none h-20"
                          value={field.value ?? ""}
                        />
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
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Status).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  {editingUnit && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingUnit(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading
                      ? editingUnit
                        ? "Saving..."
                        : "Creating..."
                      : editingUnit
                      ? "Save Changes"
                      : "Create Unit"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Table Section - Right Side */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-medium">Units of Measure List</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTableLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : unitOfMeasures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No units of measure found. Create one using the form.
                      </TableCell>
                    </TableRow>
                  ) : (
                    unitOfMeasures.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">
                          {unit.name}
                        </TableCell>
                        <TableCell>{unit.symbol}</TableCell>
                        <TableCell>{unit.description}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(
                              unit.status
                            )}`}
                          >
                            {getStatusDisplay(unit.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(unit)}
                              disabled={isTableLoading}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(unit)}
                              disabled={isTableLoading}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
