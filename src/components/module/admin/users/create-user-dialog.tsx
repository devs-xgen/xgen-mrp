"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getAvailableInspectors,
  createInspectorForUser,
  linkUserToInspector,
} from "@/lib/actions/user-inspector";

// Enhanced form schema with inspector-related fields
const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  role: z.enum(["ADMIN", "WORKER", "INSPECTOR", "DELIVERY"]),
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),

  // Inspector related fields
  isInspector: z.boolean().default(false),
  inspectorOption: z.enum(["new", "existing"]).optional(),
  existingInspectorId: z.string().optional(),

  // Additional inspector fields (only those not in basic information)
  phoneNumber: z.string().optional(),
  specialization: z.string().optional(),
  certificationLevel: z.string().optional(),
  yearsOfExperience: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  notes: z.string().optional(),
});

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableInspectors, setAvailableInspectors] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "WORKER",
      firstName: "",
      lastName: "",
      employeeId: "",
      department: "",
      position: "",
      isInspector: false,
      inspectorOption: "new",
      existingInspectorId: "",
      phoneNumber: "",
      specialization: "",
      certificationLevel: "",
      yearsOfExperience: undefined,
      notes: "",
    },
  });

  // Watch for changes in isInspector field
  const isInspector = form.watch("isInspector");
  const inspectorOption = form.watch("inspectorOption");
  const role = form.watch("role");

  // Sync role field with isInspector
  useEffect(() => {
    if (isInspector && role !== "INSPECTOR") {
      form.setValue("role", "INSPECTOR");
    }
  }, [isInspector, role, form]);

  // Fetch available inspectors when dialog opens
  useEffect(() => {
    if (open && isInspector) {
      const fetchInspectors = async () => {
        try {
          const inspectors = await getAvailableInspectors();
          setAvailableInspectors(inspectors);
        } catch (error) {
          console.error("Error fetching available inspectors:", error);
          setError("Failed to load available inspectors.");
        }
      };

      fetchInspectors();
    }
  }, [open, isInspector]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      setError(null);

      // User data to send to API
      const userData = {
        email: values.email,
        password: values.password,
        role: values.role,
        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          employeeId: values.employeeId || null,
          department: values.department || null,
          position: values.position || null,
        },
      };

      // Create the user
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create user");
      }

      const userId = data.id;

      // If the user should be an inspector, handle that relationship
      if (values.isInspector) {
        if (
          values.inspectorOption === "existing" &&
          values.existingInspectorId
        ) {
          // Link the user to an existing inspector
          await linkUserToInspector(userId, values.existingInspectorId);
        } else if (values.inspectorOption === "new") {
          // Create a new inspector and link to user
          await createInspectorForUser(userId, {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phoneNumber: values.phoneNumber,
            department: values.department,
            specialization: values.specialization,
            certificationLevel: values.certificationLevel,
            yearsOfExperience: values.yearsOfExperience,
            notes: values.notes,
          });
        }
      }

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error in form submission:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. Fill in their details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // If role changes to INSPECTOR, set isInspector to true
                          if (
                            value === "INSPECTOR" &&
                            !form.getValues("isInspector")
                          ) {
                            form.setValue("isInspector", true);
                          } else if (
                            value !== "INSPECTOR" &&
                            form.getValues("isInspector")
                          ) {
                            form.setValue("isInspector", false);
                          }
                        }}
                        defaultValue={field.value}
                        value={field.value}
                      >
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
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </div>

            <Separator />

            {/* Inspector Toggle */}
            <FormField
              control={form.control}
              name="isInspector"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Inspector Role</FormLabel>
                    <FormDescription>
                      Set this user as an inspector for quality checks
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && form.getValues("role") !== "INSPECTOR") {
                          form.setValue("role", "INSPECTOR");
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Inspector Options (shows only when isInspector is true) */}
            {isInspector && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-lg font-medium">Inspector Details</h3>

                <FormField
                  control={form.control}
                  name="inspectorOption"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Inspector Option</FormLabel>
                      <FormControl>
                        <Tabs
                          value={field.value}
                          onValueChange={field.onChange}
                          className="w-full"
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="new">
                              Create New Inspector
                            </TabsTrigger>
                            <TabsTrigger
                              value="existing"
                              disabled={availableInspectors.length === 0}
                            >
                              Link to Existing
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {inspectorOption === "existing" ? (
                  <FormField
                    control={form.control}
                    name="existingInspectorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Inspector</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an existing inspector" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableInspectors.map((inspector) => (
                              <SelectItem
                                key={inspector.inspectorId}
                                value={inspector.inspectorId}
                              >
                                {inspector.firstName} {inspector.lastName} (
                                {inspector.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {availableInspectors.length === 0 && (
                          <FormDescription className="text-destructive">
                            No available inspectors found. Please create a new
                            inspector.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-4">
                    <FormDescription>
                      Add inspector-specific details below. Basic information
                      will be used from above.
                    </FormDescription>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Contact phone number"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialization</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Quality control area"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="certificationLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certification Level</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Level 1, Senior"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="yearsOfExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Number of years"
                                {...field}
                                value={
                                  field.value === undefined ? "" : field.value
                                }
                                onChange={(e) => {
                                  const value =
                                    e.target.value === ""
                                      ? undefined
                                      : parseInt(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inspector Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional information about this inspector"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
