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
import { Material } from "@prisma/client";

interface MaterialFormData {
  name: string;
  symbol: string;
  description: string;
  category: string;
  status: string;
  notes: string;
}

interface MaterialManagementProps {
  materials: Material[];
  onSuccess?: () => void;
}

export function MaterialManagement({
  materials,
  onSuccess,
}: MaterialManagementProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const form = useForm<MaterialFormData>({
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      category: "",
      status: "ACTIVE",
      notes: "",
    },
  });

  const onSubmit = async (data: MaterialFormData) => {
    try {
      setLoading(true);
      const url = editingMaterial
        ? `/api/materials/${editingMaterial.id}`
        : "/api/materials";
      const method = editingMaterial ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          editingMaterial
            ? "Failed to update material"
            : "Failed to create material"
        );
      }

      toast({
        title: "Success",
        description: editingMaterial
          ? "Material updated successfully"
          : "Material created successfully",
      });
      form.reset();
      setEditingMaterial(null);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    form.reset({
      name: material.name,
      symbol: material.symbol,
      description: material.description || "",
      category: material.category || "",
      status: material.status || "ACTIVE",
      notes: material.notes || "",
    });
  };

  const handleDelete = async (materialId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete material");
      }

      toast({
        title: "Success",
        description: "Material deleted successfully",
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete material",
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
          Manage Materials
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Material Management</SheetTitle>
          <SheetDescription>
            Create and manage your materials.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Material name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Material name" {...field} />
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
                      <Input placeholder="Material symbol" {...field} />
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
                      <Input placeholder="Material category" {...field} />
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
                    <FormControl>
                      <Input placeholder="Material status" {...field} />
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
                      <Textarea placeholder="Additional notes" {...field} />
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
                  : editingMaterial
                  ? "Update Material"
                  : "Create Material"}
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
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        material.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {material.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(material)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
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
