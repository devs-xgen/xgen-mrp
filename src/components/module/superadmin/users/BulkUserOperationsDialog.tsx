"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  bulkSuspendUsers,
  bulkActivateUsers,
  bulkChangeUserRoles,
  bulkResetPasswords,
} from "@/lib/actions/superadmin";

const formSchema = z.object({
  reason: z.string().min(15, "Reason must be at least 15 characters"),
  newRole: z.string().optional(),
});

interface BulkUserOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserIds: string[];
  users: any[];
  operation: "suspend" | "activate" | "changeRole" | "resetPassword";
  onSuccess?: () => void;
}

export function BulkUserOperationsDialog({
  open,
  onOpenChange,
  selectedUserIds,
  users,
  operation,
  onSuccess,
}: BulkUserOperationsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      newRole: "WORKER",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      let result;

      if (operation === "suspend") {
        result = await bulkSuspendUsers(selectedUserIds, values.reason);
      } else if (operation === "activate") {
        result = await bulkActivateUsers(selectedUserIds, values.reason);
      } else if (operation === "changeRole") {
        if (!values.newRole) {
          toast({
            title: "Invalid Input",
            description: "Please select a role",
            variant: "destructive",
          });
          return;
        }
        result = await bulkChangeUserRoles(selectedUserIds, values.newRole, values.reason);
      } else if (operation === "resetPassword") {
        result = await bulkResetPasswords(selectedUserIds, values.reason);
      }

      if (!result || !result.success) {
        toast({
          title: "Operation Failed",
          description: result?.error || "Failed to perform bulk operation",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Bulk Operation Successful",
        description: `Updated ${result.count} user${result.count > 1 ? "s" : ""}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to perform operation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getTitle = () => {
    switch (operation) {
      case "suspend": return "Suspend Users";
      case "activate": return "Activate Users";
      case "changeRole": return "Change User Roles";
      case "resetPassword": return "Reset Passwords";
      default: return "Bulk Operation";
    }
  };

  const getDescription = () => {
    switch (operation) {
      case "suspend": return "Suspend user accounts (prevents login)";
      case "activate": return "Activate suspended user accounts";
      case "changeRole": return "Change roles for selected users";
      case "resetPassword": return "Force password reset for selected users";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {getDescription()} - {selectedUserIds.length} user{selectedUserIds.length > 1 ? "s" : ""} selected
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Bulk User Operation
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              This action will affect <strong>{selectedUserIds.length} user accounts</strong>.
              All changes will be logged in the audit trail.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {operation === "changeRole" && (
                <FormField
                  control={form.control}
                  name="newRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="WORKER">Worker</SelectItem>
                          <SelectItem value="INSPECTOR">Inspector</SelectItem>
                          <SelectItem value="DELIVERY">Delivery</SelectItem>
                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Role to assign to all selected users
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Reason (Min 15 characters)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you're performing this bulk operation..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This reason applies to all {selectedUserIds.length} user{selectedUserIds.length > 1 ? "s" : ""}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? `Processing ${selectedUserIds.length} users...`
                    : `Update ${selectedUserIds.length} Users`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
