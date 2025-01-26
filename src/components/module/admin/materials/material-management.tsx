"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Trash, Layers } from "lucide-react";
import * as z from "zod";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// Schema for material validation
const materialSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters"),
  description: z.string().max(500, "Description must not exceed 500 characters").optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface Material {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface MaterialDialogProps {
  materials: Material[];
  onSuccess?: () => Promise<void>;
}

export function MaterialDialog({ materials, onSuccess }: MaterialDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const { toast } = useToast();

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
    },
  });

  const onSubmit = async (values: MaterialFormValues) => {
    try {
      setIsLoading(true);
      const url = editingMaterial
        ? `/api/materials/${editingMaterial.id}`
        : "/api/materials";

      const response = await fetch(url, {
        method: editingMaterial ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save material");
      }

      toast({
        title: "Success",
        description: `Material ${editingMaterial ? "updated" : "created"} successfully`,
      });

      form.reset();
      setEditingMaterial(null);
      if (onSuccess) await onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save material",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEdit = (material: Material) => {
    setEditingMaterial(material);
    form.reset({
      name: material.name,
      category: material.category,
      description: material.description || "",
    });
  };

  const onDelete = async (material: Material) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/materials/${material.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete material");
      }

      toast({
        title: "Success",
        description: "Material deleted successfully",
      });

      if (onSuccess) await onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error
          ? error.message
          : "Failed to delete material. It might be in use.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Layers className="h-4 w-4 mr-2" />
          Materials
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage Materials</DialogTitle>
          <DialogDescription>Create and manage materials for inventory.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[400px,1fr] gap-6">
          {/* Form Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-medium">
              {editingMaterial ? "Edit Material" : "Add New Material"}
            </h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter material name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter material category" />
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
                        <Textarea {...field} placeholder="Enter material description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  {editingMaterial && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingMaterial(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingMaterial ? "Save Changes" : "Create Material"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Table Section */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-medium">Materials List</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No materials found. Create one using the form.
                      </TableCell>
                    </TableRow>
                  ) : (
                    materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.name}</TableCell>
                        <TableCell>{material.category}</TableCell>
                        <TableCell>{material.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(material)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(material)}
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
