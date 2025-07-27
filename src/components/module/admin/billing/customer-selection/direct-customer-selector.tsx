"use client";

import { useState, useEffect } from "react";
import { Search, User, Mail, Phone, MapPin, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Customer } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";

interface DirectCustomerSelectorProps {
  customers: Customer[];
  selectedCustomer?: Customer;
  onCustomerSelect: (customer: Customer) => void;
  onClear: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function DirectCustomerSelector({
  customers,
  selectedCustomer,
  onCustomerSelect,
  onClear,
  disabled = false,
  loading = false,
}: DirectCustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);

  // Filter customers based on search
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter((customer) => {
      const searchLower = searchValue.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.code.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower) ||
        (customer.contactPerson && customer.contactPerson.toLowerCase().includes(searchLower))
      );
    });

    setFilteredCustomers(filtered);
  }, [searchValue, customers]);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setOpen(false);
    setSearchValue("");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="direct-customer-selector">Direct Customer</Label>
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="flex-1 justify-between"
                disabled={disabled || loading}
              >
                {selectedCustomer ? (
                  <span className="truncate">
                    {selectedCustomer.name} - {selectedCustomer.email}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select customer...</span>
                )}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search customers by name, email, or code..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>
                    {loading ? "Loading customers..." : "No customers found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => handleCustomerSelect(customer)}
                        className="flex flex-col items-start p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{customer.name}</span>
                            <Badge className={getStatusColor(customer.status)}>
                              {customer.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {customer.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground w-full">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.contactPerson && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="truncate">{customer.contactPerson}</span>
                            </div>
                          )}
                        </div>
                        {customer.address && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {customer.address}
                              {customer.city && `, ${customer.city}`}
                              {customer.state && `, ${customer.state}`}
                            </span>
                          </div>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedCustomer && (
            <Button
              variant="outline"
              size="icon"
              onClick={onClear}
              disabled={disabled}
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Selected Customer Preview */}
      {selectedCustomer && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Selected Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Customer Name:</span>
                <div className="font-semibold">{selectedCustomer.name}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Customer Code:</span>
                <div className="font-mono">{selectedCustomer.code}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Email:</span>
                <div>{selectedCustomer.email}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Phone:</span>
                <div>{selectedCustomer.phone}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Status:</span>
                <div>
                  <Badge className={getStatusColor(selectedCustomer.status)}>
                    {selectedCustomer.status}
                  </Badge>
                </div>
              </div>
              {selectedCustomer.tinNumber && (
                <div>
                  <span className="font-medium text-muted-foreground">TIN Number:</span>
                  <div className="font-mono">{selectedCustomer.tinNumber}</div>
                </div>
              )}
            </div>

            {/* Address Information */}
            {selectedCustomer.address && (
              <div className="pt-2 border-t">
                <span className="font-medium text-muted-foreground text-sm">Address:</span>
                <div className="text-sm mt-1">
                  <div>{selectedCustomer.address}</div>
                  {(selectedCustomer.city || selectedCustomer.state || selectedCustomer.postalCode) && (
                    <div className="text-muted-foreground">
                      {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                      {selectedCustomer.country && `, ${selectedCustomer.country}`}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Information */}
            {(selectedCustomer.creditLimit || selectedCustomer.paymentTerms) && (
              <div className="pt-2 border-t">
                <span className="font-medium text-muted-foreground text-sm">Payment Information:</span>
                <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                  {selectedCustomer.creditLimit && (
                    <div>
                      <span className="font-medium text-muted-foreground">Credit Limit:</span>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        <span className="font-mono">{formatCurrencyPHP(selectedCustomer.creditLimit)}</span>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.paymentTerms && (
                    <div>
                      <span className="font-medium text-muted-foreground">Payment Terms:</span>
                      <div>{selectedCustomer.paymentTerms}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Person */}
            {selectedCustomer.contactPerson && (
              <div className="pt-2 border-t">
                <span className="font-medium text-muted-foreground text-sm">Contact Person:</span>
                <div className="text-sm mt-1">{selectedCustomer.contactPerson}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-population Notice */}
      {selectedCustomer && (
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Auto-populated:</strong> Customer name will be automatically filled in the billing form. 
            You can manually add invoice items for this customer.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}