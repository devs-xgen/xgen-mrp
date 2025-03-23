// src/components/module/admin/materials/material-type-dialog.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ListTree, Pencil, Trash, Loader2 } from "lucide-react";
import { MaterialType, Status } from "@prisma/client";
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
  createMaterialType,
  updateMaterialType,
  deleteMaterialType,
} from "@/lib/actions/material-types";

const materialTypeSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .nullable(),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
});

type MaterialTypeFormValues = z.infer<typeof materialTypeSchema>;

interface MaterialTypeDialogProps {
  materialTypes: {
    id: string;
    name: string;
    description?: string | null;
    status: Status;
  }[];
  onSuccess?: () => Promise<void>;
}

export function MaterialTypeDialog({
  materialTypes,
  onSuccess,
}: MaterialTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [editingType, setEditingType] = useState<{
    id: string;
    name: string;
    description?: string | null;
    status: Status;
  } | null>(null);
  const { toast } = useToast();

  const form = useForm<MaterialTypeFormValues>({
    resolver: zodResolver(materialTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      status: Status.ACTIVE,
    },
  });

  const onSubmit = async (values: MaterialTypeFormValues) => {
    try {
      setIsLoading(true);

      if (editingType) {
        await updateMaterialType(editingType.id, {
          name: values.name,
          description: values.description,
          status: values.status,
        });
      } else {
        await createMaterialType({
          name: values.name,
          description: values.description,
          status: values.status,
        });
      }

      toast({
        title: "Success",
        description: `Material type ${
          editingType ? "updated" : "created"
        } successfully`,
      });

      form.reset();
      setEditingType(null);
      if (onSuccess) await onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save material type",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async (type: {
    id: string;
    name: string;
    description?: string | null;
    status: Status;
  }) => {
    if (!confirm("Are you sure you want to delete this material type?")) return;

    try {
      setIsTableLoading(true);
      await deleteMaterialType(type.id);

      toast({
        title: "Success",
        description: "Material type deleted successfully",
      });

      if (onSuccess) await onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete material type. It might be in use.",
        variant: "destructive",
      });
    } finally {
      setIsTableLoading(false);
    }
  };

  const onEdit = (type: {
    id: string;
    name: string;
    description?: string | null;
    status: Status;
  }) => {
    setEditingType(type);
    form.reset({
      name: type.name,
      description: type.description || "",
      status: type.status,
    });
  };

  const getStatusBadgeStyle = (status: Status) => {
    switch (status) {
      case Status.ACTIVE:
        return "bg-green-100 text-green-800";
      case Status.INACTIVE:
        return "bg-gray-100 text-gray-800";
      case Status.PENDING:
        return "bg-blue-100 text-blue-800";
      case Status.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800";
      case Status.COMPLETED:
        return "bg-purple-100 text-purple-800";
      case Status.CANCELLED:
        return "bg-red-100 text-red-800";
      case Status.SUSPENDED:
        return "bg-orange-100 text-orange-800";
      case Status.ARCHIVED:
        return "bg-gray-200 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (status: Status) => {
    return (
      status.toString().charAt(0).toUpperCase() +
      status.toString().slice(1).toLowerCase()
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ListTree className="h-4 w-4 mr-2" />
          Material Types
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage Material Types</DialogTitle>
          <DialogDescription>
            Create and manage material types
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[400px,1fr] gap-6">
          {/* Form Section - Left Side */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-medium">
              {editingType ? "Edit Material Type" : "Add New Material Type"}
            </h3>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter type name" />
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
                          <SelectTrigger>
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
                  {editingType && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingType(null);
                        form.reset({
                          name: "",
                          description: "",
                          status: Status.ACTIVE,
                        });
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
                      ? editingType
                        ? "Saving..."
                        : "Creating..."
                      : editingType
                      ? "Save Changes"
                      : "Create Type"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Table Section - Right Side */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-medium">Material Types List</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTableLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : materialTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No material types found. Create one using the form.
                      </TableCell>
                    </TableRow>
                  ) : (
                    materialTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">
                          {type.name}
                        </TableCell>
                        <TableCell>{type.description}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(
                              type.status
                            )}`}
                          >
                            {getStatusDisplay(type.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(type)}
                              disabled={isTableLoading}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(type)}
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
