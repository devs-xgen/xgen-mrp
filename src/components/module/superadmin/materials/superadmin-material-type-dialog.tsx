"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Status } from "@prisma/client";
import { ListTree, Loader2, Pencil, Trash } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  createMaterialTypeForSuperAdmin,
  deleteMaterialTypeForSuperAdmin,
  updateMaterialTypeForSuperAdmin,
} from "@/lib/actions/superadmin/material-types";

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

type MaterialTypeSummary = {
  id: string;
  name: string;
  description?: string | null;
  status: Status;
};

interface SuperAdminMaterialTypeDialogProps {
  materialTypes: MaterialTypeSummary[];
  onSuccess?: () => Promise<void> | void;
}

export function SuperAdminMaterialTypeDialog({
  materialTypes,
  onSuccess,
}: SuperAdminMaterialTypeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isTableBusy, setIsTableBusy] = useState(false);
  const [editingType, setEditingType] = useState<MaterialTypeSummary | null>(
    null,
  );

  const form = useForm<MaterialTypeFormValues>({
    resolver: zodResolver(materialTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      status: Status.ACTIVE,
    },
  });

  useEffect(() => {
    if (!open) {
      setEditingType(null);
      form.reset({
        name: "",
        description: "",
        status: Status.ACTIVE,
      });
    }
  }, [open, form]);

  const handleSubmit = (values: MaterialTypeFormValues) => {
    startSubmitTransition(async () => {
      try {
        const payload = {
          name: values.name,
          description: values.description ?? null,
          status: values.status,
        };

        if (editingType) {
          await updateMaterialTypeForSuperAdmin(editingType.id, payload);
        } else {
          await createMaterialTypeForSuperAdmin(payload);
        }

        toast({
          title: editingType ? "Material type updated" : "Material type created",
          description: editingType
            ? `Saved changes to ${editingType.name}.`
            : "New material type added successfully.",
        });

        setEditingType(null);
        form.reset({
          name: "",
          description: "",
          status: Status.ACTIVE,
        });
        await onSuccess?.();
      } catch (error) {
        toast({
          title: "Unable to save material type",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while saving.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (type: MaterialTypeSummary) => {
    if (!confirm(`Delete material type "${type.name}"?`)) return;

    setIsTableBusy(true);
    deleteMaterialTypeForSuperAdmin(type.id)
      .then(async () => {
        toast({
          title: "Material type deleted",
          description: `${type.name} removed successfully.`,
        });
        await onSuccess?.();
      })
      .catch((error) => {
        toast({
          title: "Unable to delete type",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while deleting.",
          variant: "destructive",
        });
      })
      .finally(() => setIsTableBusy(false));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ListTree className="mr-2 h-4 w-4" />
          Material Types
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage Material Types</DialogTitle>
          <DialogDescription>
            Create, update, or retire material type categories.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[360px,1fr] gap-6">
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">
              {editingType ? "Edit material type" : "Add material type"}
            </h3>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter type name" {...field} />
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
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a brief description"
                          className="resize-none"
                          {...field}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Status).map((statusOption) => (
                            <SelectItem key={statusOption} value={statusOption}>
                              {statusOption.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end gap-2 pt-2">
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
                      Cancel edit
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingType ? "Save changes" : "Create type"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="border-b p-4">
              <h3 className="font-medium">Existing material types</h3>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[96px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTableBusy && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating…
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!isTableBusy && materialTypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                        No material types found. Create one using the form on the left.
                      </TableCell>
                    </TableRow>
                  )}

                  {!isTableBusy &&
                    materialTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {type.description || "—"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {type.status.toLowerCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingType(type);
                                form.reset({
                                  name: type.name,
                                  description: type.description ?? "",
                                  status: type.status,
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDelete(type)}
                              disabled={isTableBusy}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
