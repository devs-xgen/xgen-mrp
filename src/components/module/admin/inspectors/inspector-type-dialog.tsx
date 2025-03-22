"use client";

import * as React from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from "@/hooks/use-toast";
// import { createInspector } from "@/lib/actions/inspectors";
import { PlusIcon } from "lucide-react";
import { createInspectorType } from "@/lib/actions/inspector";

// Define the form schema with validation
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Inspector type name must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

export function InspectorTypeDialog({
  inspectorTypes = [],
  onSuccess,
}: {
  inspectorTypes: any[];
  onSuccess: () => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // Check if inspector type with same name already exists
      const exists = inspectorTypes.some(
        (type) => type.name.toLowerCase() === values.name.toLowerCase()
      );

      if (exists) {
        toast({
          title: "Inspector type already exists",
          description: "An inspector type with this name already exists.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      await createInspectorType(values);
      toast({
        title: "Inspector type created",
        description: "New inspector type has been created successfully.",
      });
      form.reset();
      setOpen(false);
      if (onSuccess) await onSuccess();
    } catch (error) {
      console.error("Error creating inspector type:", error);
      toast({
        title: "Error",
        description: "Failed to create inspector type. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Inspector Type</DialogTitle>
          <DialogDescription>
            Create a new inspector type to categorize your inspectors.
          </DialogDescription>
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
                    <Input placeholder="e.g., Quality Control" {...field} />
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
                      placeholder="Describe the inspector type..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}