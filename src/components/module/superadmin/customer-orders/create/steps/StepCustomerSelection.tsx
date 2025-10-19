"use client";

import { UseFormReturn } from "react-hook-form";
import {
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User } from "lucide-react";

interface StepCustomerSelectionProps {
  form: UseFormReturn<any>;
  customers: Array<{
    id: string;
    name: string;
    email: string;
    tenantId: string;
  }>;
  tenants: Array<{
    id: string;
    name: string;
  }>;
}

export function StepCustomerSelection({
  form,
  customers,
  tenants,
}: StepCustomerSelectionProps) {
  const selectedTenantId = form.watch("tenantId");
  const filteredCustomers = selectedTenantId
    ? customers.filter((c) => c.tenantId === selectedTenantId)
    : customers;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Select Tenant
          </CardTitle>
          <CardDescription>
            Choose the tenant organization for this customer order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="tenantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset customer when tenant changes
                    form.setValue("customerId", "");
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The tenant that owns this customer order
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Select Customer
          </CardTitle>
          <CardDescription>
            Choose the customer placing this order
            {selectedTenantId && (
              <span className="block text-xs mt-1">
                Showing {filteredCustomers.length} customer(s) for selected tenant
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedTenantId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedTenantId ? "Select customer" : "Select tenant first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-xs text-muted-foreground">{customer.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {!selectedTenantId && "Please select a tenant first"}
                  {selectedTenantId && "The customer receiving this order"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
