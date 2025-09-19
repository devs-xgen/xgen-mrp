"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Role, UserStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UserData } from "@/types/admin/user";
import { updateUser } from "@/lib/actions/users";
import {
  createInspectorForUser,
  getAvailableInspectors,
  linkUserToInspector,
  getInspectorByUserId,
  updateInspector as updateInspectorAction,
} from "@/lib/actions/user-inspector";

const formSchema = z.object({
  role: z.enum(["ADMIN", "WORKER", "INSPECTOR", "DELIVERY", "DEVELOPER", "SUPER_ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData;
  onSuccess?: () => void;
}

type InspectorData = {
  inspectorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  department: string | null;
  specialization: string | null;
  certificationLevel: string | null;
  yearsOfExperience: number | null;
  isActive: boolean;
  notes: string | null;
} | null;

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectorFetchLoading, setInspectorFetchLoading] = useState(false);
  const [inspectorDirty, setInspectorDirty] = useState(false);
  const [availableInspectors, setAvailableInspectors] = useState<
    Array<{ inspectorId: string; firstName: string; lastName: string; email: string }>
  >([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | null>(
    null
  );
  const [inspectorError, setInspectorError] = useState<string | null>(null);
  const [inspectorSuccess, setInspectorSuccess] = useState<string | null>(null);
  const [inspector, setInspector] = useState<InspectorData>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user.role,
      status: user.status,
      firstName: user.profile?.firstName || "",
      lastName: user.profile?.lastName || "",
      employeeId: user.profile?.employeeId || "",
      department: user.profile?.department || "",
      position: user.profile?.position || "",
    },
  });

  const role = form.watch("role");

  useEffect(() => {
    async function fetchInspector() {
      if (!open) return;
      if (role !== "INSPECTOR") {
        setInspectorDirty(false);
        setInspector(null);
        return;
      }
      try {
        setInspectorError(null);
        setInspectorSuccess(null);
        setInspectorFetchLoading(true);
        const data = await getInspectorByUserId(user.id);
        setInspector((data as any) ?? null);
        setInspectorDirty(false);
      } catch (e) {
        setInspectorError(e instanceof Error ? e.message : "Failed to load inspector details");
      } finally {
        setInspectorFetchLoading(false);
      }
    }
    fetchInspector();
  }, [role, user.id, open]);

  async function handleCreateInspector() {
    try {
      setInspectorError(null);
      setInspectorSuccess(null);
      setInspectorLoading(true);
      await createInspectorForUser(user.id, {
        firstName: form.getValues("firstName"),
        lastName: form.getValues("lastName"),
        email: user.email,
      });
      setInspectorSuccess("Inspector created and linked to user.");
      onSuccess?.();
      // Refresh inspector data in the dialog
      try {
        const data = await getInspectorByUserId(user.id);
        setInspector((data as any) ?? null);
        setInspectorDirty(false);
      } catch (e) {
        // Non-fatal: surface as inline message
        setInspectorError(e instanceof Error ? e.message : "Failed to refresh inspector data");
      }
    } catch (e) {
      setInspectorError(
        e instanceof Error ? e.message : "Failed to create inspector"
      );
    } finally {
      setInspectorLoading(false);
    }

  }

  // Note: saving inspector changes is now handled as part of the main Save Changes submit

  async function loadAvailableInspectors() {
    try {
      setInspectorError(null);
      setInspectorSuccess(null);
      setInspectorLoading(true);
      const list = await getAvailableInspectors();
      setAvailableInspectors(list);
    } catch (e) {
      setInspectorError(
        e instanceof Error ? e.message : "Failed to load inspectors"
      );
    } finally {
      setInspectorLoading(false);
    }
  }

  async function handleLinkInspector() {
    if (!selectedInspectorId) {
      setInspectorError("Please select an inspector to link.");
      return;
    }
    try {
      setInspectorError(null);
      setInspectorSuccess(null);
      setInspectorLoading(true);
      await linkUserToInspector(user.id, selectedInspectorId);
      setInspectorSuccess("Inspector linked to user.");
      onSuccess?.();
      // Refresh inspector data to show the newly linked inspector in the panel
      try {
        const data = await getInspectorByUserId(user.id);
        setInspector((data as any) ?? null);
        setInspectorDirty(false);
        setSelectedInspectorId(null);
        setAvailableInspectors([]);
      } catch (e) {
        setInspectorError(
          e instanceof Error ? e.message : "Failed to refresh inspector data"
        );
      }
    } catch (e) {
      setInspectorError(
        e instanceof Error ? e.message : "Failed to link inspector"
      );
    } finally {
      setInspectorLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      setError(null);
      const userDirty = form.formState.isDirty;
      const shouldSaveInspector =
        role === "INSPECTOR" && !!inspector && inspectorDirty;

      const ops: Promise<any>[] = [];

      if (userDirty) {
        const updateData = {
          id: user.id,
          role: values.role as Role,
          status: values.status as UserStatus,
          profile: {
            firstName: values.firstName,
            lastName: values.lastName,
            employeeId: values.employeeId || null,
            department: values.department || null,
            position: values.position || null,
          },
        };
        ops.push(updateUser(updateData));
      }

      if (shouldSaveInspector) {
        ops.push(
          updateInspectorAction(inspector!.inspectorId, {
            firstName: inspector!.firstName,
            lastName: inspector!.lastName,
            email: inspector!.email,
            phoneNumber: inspector!.phoneNumber ?? null,
            department: inspector!.department ?? null,
            specialization: inspector!.specialization ?? null,
            certificationLevel: inspector!.certificationLevel ?? null,
            yearsOfExperience: inspector!.yearsOfExperience ?? null,
            isActive: inspector!.isActive,
            notes: inspector!.notes ?? null,
          })
        );
      }

      if (ops.length === 0) {
        // Nothing to save; keep dialog open but disable button prevents this path
        return;
      }

      await Promise.all(ops);

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating user:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details for {user.email}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div
              className={
                role === "INSPECTOR"
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-6"
                  : "grid grid-cols-1"
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="WORKER">Worker</SelectItem>
                            <SelectItem value="INSPECTOR">Inspector</SelectItem>
                            <SelectItem value="DELIVERY">Delivery</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="DEVELOPER">Developer</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {role === "INSPECTOR" && (
                <div className="space-y-3 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4">
                  <div>
                    <div className="text-sm font-medium">Inspector</div>
                    <div className="text-xs text-muted-foreground">
                      {inspector ? "Edit linked inspector details." : "Create a new inspector for this user or link an existing one."}
                    </div>
                  </div>
                  {inspectorError && (
                    <Alert variant="destructive">
                      <AlertDescription>{inspectorError}</AlertDescription>
                    </Alert>
                  )}
                  {inspectorSuccess && (
                    <Alert>
                      <AlertDescription>{inspectorSuccess}</AlertDescription>
                    </Alert>
                  )}

                  {inspectorFetchLoading ? (
                    <div className="text-sm text-muted-foreground">Loading inspector...</div>
                  ) : inspector ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium mb-1">First name</div>
                          <Input
                            value={inspector.firstName}
                            onChange={(e) => {
                              setInspector({ ...inspector, firstName: e.target.value });
                              setInspectorDirty(true);
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Last name</div>
                          <Input
                            value={inspector.lastName}
                            onChange={(e) => {
                              setInspector({ ...inspector, lastName: e.target.value });
                              setInspectorDirty(true);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium mb-1">Email</div>
                        <Input value={inspector.email} disabled />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium mb-1">Phone number</div>
                          <Input
                            value={inspector.phoneNumber ?? ""}
                            onChange={(e) => {
                              setInspector({ ...inspector, phoneNumber: e.target.value });
                              setInspectorDirty(true);
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Department</div>
                          <Input
                            value={inspector.department ?? ""}
                            onChange={(e) => {
                              setInspector({ ...inspector, department: e.target.value });
                              setInspectorDirty(true);
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium mb-1">Specialization</div>
                          <Input
                            value={inspector.specialization ?? ""}
                            onChange={(e) => {
                              setInspector({ ...inspector, specialization: e.target.value });
                              setInspectorDirty(true);
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Certification level</div>
                          <Input
                            value={inspector.certificationLevel ?? ""}
                            onChange={(e) => {
                              setInspector({ ...inspector, certificationLevel: e.target.value });
                              setInspectorDirty(true);
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium mb-1">Years of experience</div>
                          <Input
                            type="number"
                            value={inspector.yearsOfExperience ?? ""}
                            onChange={(e) => {
                              setInspector({
                                ...inspector,
                                yearsOfExperience: e.target.value === "" ? null : Number(e.target.value),
                              });
                              setInspectorDirty(true);
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={inspector.isActive}
                            onCheckedChange={(v) => {
                              setInspector({ ...inspector, isActive: v });
                              setInspectorDirty(true);
                            }}
                          />
                          <div className="text-sm">Active</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium mb-1">Notes</div>
                        <Textarea
                          value={inspector.notes ?? ""}
                          onChange={(e) => {
                            setInspector({ ...inspector, notes: e.target.value });
                            setInspectorDirty(true);
                          }}
                          rows={3}
                        />
                      </div>

                      {/* Inspector changes will be saved with the main Save Changes button */}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="text-sm">Create new inspector</div>
                        <Button
                          type="button"
                          onClick={handleCreateInspector}
                          disabled={inspectorLoading}
                        >
                          {inspectorLoading ? "Working..." : "Create Inspector"}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">Link existing inspector</div>
                        {availableInspectors.length === 0 ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={loadAvailableInspectors}
                            disabled={inspectorLoading}
                          >
                            {inspectorLoading ? "Loading..." : "Load Available Inspectors"}
                          </Button>
                        ) : (
                          <>
                            <Select
                              onValueChange={(v) => setSelectedInspectorId(v)}
                              defaultValue={selectedInspectorId ?? undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select inspector" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableInspectors.map((i) => (
                                  <SelectItem key={i.inspectorId} value={i.inspectorId}>
                                    {i.firstName} {i.lastName} ({i.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              onClick={handleLinkInspector}
                              disabled={!selectedInspectorId || inspectorLoading}
                            >
                              {inspectorLoading ? "Linking..." : "Link Inspector"}
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  isLoading || !(form.formState.isDirty || inspectorDirty)
                }
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
