"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Status } from "@prisma/client";
import { Ruler, Loader2, Pencil, Trash } from "lucide-react";
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
  createUnitOfMeasureForSuperAdmin,
  deleteUnitOfMeasureForSuperAdmin,
  updateUnitOfMeasureForSuperAdmin,
} from "@/lib/actions/superadmin/unit-of-measure";

const unitSchema = z.object({
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
    .optional()
    .nullable(),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
});

type UnitFormValues = z.infer<typeof unitSchema>;

type UnitSummary = {
  id: string;
  name: string;
  symbol: string;
  description?: string | null;
  status: Status;
};

interface SuperAdminUnitOfMeasureDialogProps {
  unitOfMeasures: UnitSummary[];
  onSuccess?: () => Promise<void> | void;
}

export function SuperAdminUnitOfMeasureDialog({
  unitOfMeasures,
  onSuccess,
}: SuperAdminUnitOfMeasureDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isTableBusy, setIsTableBusy] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitSummary | null>(null);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      status: Status.ACTIVE,
    },
  });

  useEffect(() => {
    if (!open) {
      setEditingUnit(null);
      form.reset({
        name: "",
        symbol: "",
        description: "",
        status: Status.ACTIVE,
      });
    }
  }, [open, form]);

  const handleSubmit = (values: UnitFormValues) => {
    startSubmitTransition(async () => {
      try {
        const payload = {
          name: values.name,
          symbol: values.symbol,
          description: values.description ?? null,
          status: values.status,
        };

        if (editingUnit) {
          await updateUnitOfMeasureForSuperAdmin(editingUnit.id, payload);
        } else {
          await createUnitOfMeasureForSuperAdmin(payload);
        }

        toast({
          title: editingUnit ? "Unit updated" : "Unit created",
          description: editingUnit
            ? `Saved changes to ${editingUnit.name}.`
            : "New unit of measure added successfully.",
        });

        setEditingUnit(null);
        form.reset({
          name: "",
          symbol: "",
          description: "",
          status: Status.ACTIVE,
        });
        await onSuccess?.();
      } catch (error) {
        toast({
          title: "Unable to save unit",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while saving.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (unit: UnitSummary) => {
    if (!confirm(`Delete unit of measure "${unit.name}"?`)) return;

    setIsTableBusy(true);
    deleteUnitOfMeasureForSuperAdmin(unit.id)
      .then(async () => {
        toast({
          title: "Unit deleted",
          description: `${unit.name} removed successfully.`,
        });
        await onSuccess?.();
      })
      .catch((error) => {
        toast({
          title: "Unable to delete unit",
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
          <Ruler className="mr-2 h-4 w-4" />
          Units of Measure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage Units of Measure</DialogTitle>
          <DialogDescription>
            Create and update unit of measure definitions for the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[360px,1fr] gap-6">
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">
              {editingUnit ? "Edit unit of measure" : "Add unit of measure"}
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
                        <Input placeholder="Enter unit name" {...field} />
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
                        <Input placeholder="e.g., kg, m, pcs" {...field} />
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
                          placeholder="Enter description"
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
                  {editingUnit && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingUnit(null);
                        form.reset({
                          name: "",
                          symbol: "",
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
                    {editingUnit ? "Save changes" : "Create unit"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="border-b p-4">
              <h3 className="font-medium">Existing units of measure</h3>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[96px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTableBusy && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating…
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!isTableBusy && unitOfMeasures.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                        No units found. Create one using the form on the left.
                      </TableCell>
                    </TableRow>
                  )}

                  {!isTableBusy &&
                    unitOfMeasures.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.symbol}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {unit.description || "—"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {unit.status.toLowerCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingUnit(unit);
                                form.reset({
                                  name: unit.name,
                                  symbol: unit.symbol,
                                  description: unit.description ?? "",
                                  status: unit.status,
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDelete(unit)}
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
