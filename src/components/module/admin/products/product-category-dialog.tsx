"use client";

import { useState, useEffect } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Search,
  Package,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from "@/lib/actions/product";
import type { ProductCategory } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface FormData {
  name: string;
  description: string;
}

interface ProductCategoryDialogProps {
  categories: ProductCategory[];
  onSuccess?: () => Promise<void>;
}

export function ProductCategoryDialog({
  categories,
  onSuccess,
}: ProductCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form for creating new categories
  const createForm = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Form for editing existing categories
  const editForm = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle creating new category
  const onCreateSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const result = await createCategory(data);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Category "${data.name}" created successfully`,
        });
        createForm.reset();
        await onSuccess?.();
      } else {
        throw new Error(result.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Create category error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle editing category
  const startEdit = (category: ProductCategory) => {
    setEditingId(category.id);
    editForm.reset({
      name: category.name,
      description: category.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    editForm.reset();
  };

  const onEditSubmit = async (data: FormData) => {
    if (!editingId) return;

    try {
      setLoading(true);
      
      const result = await updateCategory(editingId, data);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
        setEditingId(null);
        editForm.reset();
        await onSuccess?.();
      } else {
        throw new Error(result.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Update category error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting category
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);
      
      const result = await deleteCategory(deleteId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
        setDeleteId(null);
        await onSuccess?.();
      } else {
        throw new Error(result.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Delete category error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderPlus className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Category Management
              </DialogTitle>
              <DialogDescription>
                Create, edit, and manage your product categories. Categories help organize your products.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <div className="grid lg:grid-cols-2 h-full">
                {/* Create Category Section */}
                <div className="p-6 border-r">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FolderPlus className="h-5 w-5" />
                        Create New Category
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add a new category to organize your products
                      </p>
                    </div>

                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                        <FormField
                          control={createForm.control}
                          name="name"
                          rules={{ required: "Category name is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Apparel, Electronics, Accessories" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Brief description of this category"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="w-full"
                        >
                          {loading ? "Creating..." : "Create Category"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>

                {/* Categories List Section */}
                <div className="flex flex-col h-full">
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Existing Categories ({categories.length})
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Manage your product categories
                        </p>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Separator />

                  <ScrollArea className="flex-1 px-6">
                    {filteredCategories.length === 0 ? (
                      <div className="py-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          {searchTerm ? "No categories found matching your search" : "No categories created yet"}
                        </p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-3">
                        {filteredCategories.map((category) => (
                          <div
                            key={category.id}
                            className="group border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                          >
                            {editingId === category.id ? (
                              // Edit Mode
                              <Form {...editForm}>
                                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3">
                                  <FormField
                                    control={editForm.control}
                                    name="name"
                                    rules={{ required: "Category name is required" }}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input placeholder="Category name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={editForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Category description"
                                            rows={2}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={cancelEdit}
                                      disabled={loading}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={loading}>
                                      <Save className="h-4 w-4 mr-1" />
                                      {loading ? "Saving..." : "Save"}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            ) : (
                              // View Mode
                              <>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-base truncate">
                                        {category.name}
                                      </h4>
                                      <Badge variant="secondary" className="text-xs">
                                        {category.status}
                                      </Badge>
                                    </div>
                                    
                                    {category.description && (
                                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                        {category.description}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Created {formatDistanceToNow(new Date(category.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEdit(category)}
                                      disabled={loading}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteId(category.id)}
                                      disabled={loading}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-muted/30">
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
              Categories with associated products cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 