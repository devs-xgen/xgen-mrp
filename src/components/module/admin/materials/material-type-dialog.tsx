"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash } from "lucide-react";
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

const materialTypeSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
});

type MaterialTypeFormValues = z.infer<typeof materialTypeSchema>;

interface MaterialTypeDialogProps {
  materialTypes: MaterialType[];
  onSuccess?: () => Promise<void>;
  trigger?: React.ReactNode;
}

export function MaterialTypeDialog({
  materialTypes,
  onSuccess,
  trigger,
}: MaterialTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingType, setEditingType] = useState<MaterialType | null>(null);
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
      const url = editingType
        ? `/api/material-types/${editingType.id}`
        : "/api/material-types";

      const response = await fetch(url, {
        method: editingType ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save material type");
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

  const onEdit = (type: MaterialType) => {
    setEditingType(type);
    form.reset({
      name: type.name,
      description: type.description || "",
      status: type.status,
    });
  };

  const onDelete = async (type: MaterialType) => {
    if (!confirm("Are you sure you want to delete this material type?")) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/material-types/${type.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete material type");
      }

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
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Material Types</DialogTitle>
          <DialogDescription>
            Create and manage material types
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Section */}
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
                <div className="flex justify-end gap-2">
                  {editingType && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingType(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isLoading}>
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

          {/* List Section */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No material types found. Create one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  materialTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>{type.name}</TableCell>
                      <TableCell>{type.description}</TableCell>
                      <TableCell>{type.status.toLowerCase()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(type)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(type)}
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
      </DialogContent>
    </Dialog>
  );
}
