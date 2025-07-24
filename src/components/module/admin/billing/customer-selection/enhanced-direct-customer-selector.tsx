"use client";

import { useState, useEffect } from "react";
import { Search, User, Mail, Phone, MapPin, CreditCard, X, AlertTriangle, Building } from "lucide-react";
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
import { CustomerValidationAlert, CustomerCreditStatus } from "./customer-validation-alert";
import { getAllCustomers, validateCustomerForBilling } from "@/lib/actions/customers";

interface CustomerValidationResult {
  isValid: boolean;
  customer: Customer | null;
  warnings: string[];
  errors: string[];
}

interface EnhancedDirectCustomerSelectorProps {
  selectedCustomer?: Customer;
  onCustomerSelect: (customer: Customer) => void;
  onClear: () => void;
  onValidationChange?: (validation: CustomerValidationResult) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function EnhancedDirectCustomerSelector({
  selectedCustomer,
  onCustomerSelect,
  onClear,
  onValidationChange,
  disabled = false,
  loading = false,
}: EnhancedDirectCustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [validation, setValidation] = useState<CustomerValidationResult>({
    isValid: true,
    customer: null,
    warnings: [],
    errors: [],
  });

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

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

  // Validate customer when selection changes
  useEffect(() => {
    if (selectedCustomer) {
      validateCustomer(selectedCustomer.id);
    } else {
      const emptyValidation = {
        isValid: true,
        customer: null,
        warnings: [],
        errors: [],
      };
      setValidation(emptyValidation);
      onValidationChange?.(emptyValidation);
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const customerData = await getAllCustomers({
        status: 'ACTIVE',
        limit: 100
      });
      setCustomers(customerData);
      setFilteredCustomers(customerData);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const validateCustomer = async (customerId: string) => {
    try {
      const validationResult = await validateCustomerForBilling(customerId);
      setValidation(validationResult);
      onValidationChange?.(validationResult);
    } catch (error) {
      console.error("Failed to validate customer:", error);
      const errorValidation = {
        isValid: false,
        customer: null,
        warnings: [],
        errors: ["Failed to validate customer"],
      };
      setValidation(errorValidation);
      onValidationChange?.(errorValidation);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setOpen(false);
    setSearchValue("");
  };

  const handleClear = () => {
    onClear();
    setValidation({
      isValid: true,
      customer: null,
      warnings: [],
      errors: [],
    });
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
    <div className="space-y-4" role="region" aria-labelledby="direct-customer-selector-heading">
      <div className="space-y-2">
        <Label 
          htmlFor="enhanced-direct-customer-selector" 
          id="direct-customer-selector-heading"
          className="text-sm font-medium"
        >
          Direct Customer
        </Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id="enhanced-direct-customer-selector"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={selectedCustomer ? `Selected customer: ${selectedCustomer.name}` : "Select a customer"}
                className="flex-1 justify-between min-w-0"
                disabled={disabled || loading || isLoadingCustomers}
              >
                {selectedCustomer ? (
                  <span className="truncate">
                    {selectedCustomer.name} - {selectedCustomer.email}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select customer...</span>
                )}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[min(500px,calc(100vw-2rem))] p-0" 
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <Command>
                <CommandInput
                  placeholder="Search customers by name, email, code, or contact person..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                  aria-label="Search customers"
                />
                <CommandList role="listbox" aria-label="Customer options">
                  <CommandEmpty role="status">
                    {isLoadingCustomers ? "Loading customers..." : "No customers found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => handleCustomerSelect(customer)}
                        className="flex flex-col items-start p-3 space-y-2 cursor-pointer"
                        role="option"
                        aria-selected={selectedCustomer?.id === customer.id}
                      >
                        <div className="flex items-center justify-between w-full min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                            <span className="font-medium truncate">{customer.name}</span>
                            <Badge className={`${getStatusColor(customer.status)} flex-shrink-0`}>
                              {customer.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {customer.code}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground w-full">
                          <div className="flex items-center gap-1 min-w-0">
                            <Mail className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Phone className="h-3 w-3" aria-hidden="true" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.contactPerson && (
                            <div className="flex items-center gap-1 min-w-0">
                              <Building className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                              <span className="truncate">{customer.contactPerson}</span>
                            </div>
                          )}
                        </div>
                        {customer.address && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground w-full">
                            <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">
                              {customer.address}
                              {customer.city && `, ${customer.city}`}
                              {customer.state && `, ${customer.state}`}
                            </span>
                          </div>
                        )}
                        {customer.creditLimit && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CreditCard className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                            <span>Credit Limit: ₱{customer.creditLimit.toLocaleString()}</span>
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
              onClick={handleClear}
              disabled={disabled}
              aria-label="Clear customer selection"
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Customer Validation */}
      {selectedCustomer && (
        <CustomerValidationAlert validation={validation} />
      )}

      {/* Selected Customer Preview */}
      {selectedCustomer && (
        <Card 
          className="bg-green-50 border-green-200"
          role="region"
          aria-labelledby="selected-customer-title"
          aria-describedby="selected-customer-description"
        >
          <CardHeader className="pb-3">
            <CardTitle 
              id="selected-customer-title"
              className="text-base flex items-center gap-2"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Selected Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              id="selected-customer-description"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"
            >
              <div>
                <span className="font-medium text-muted-foreground">Customer Name:</span>
                <div className="font-semibold break-words">{selectedCustomer.name}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Customer Code:</span>
                <div className="font-mono break-all">{selectedCustomer.code}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Email:</span>
                <div className="break-all">{selectedCustomer.email}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Phone:</span>
                <div className="break-all">{selectedCustomer.phone}</div>
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
                  <div className="font-mono break-all">{selectedCustomer.tinNumber}</div>
                </div>
              )}
            </div>

            {/* Contact Person */}
            {selectedCustomer.contactPerson && (
              <div className="pt-2 border-t">
                <span className="font-medium text-muted-foreground text-sm">Contact Person:</span>
                <div className="text-sm mt-1 break-words">{selectedCustomer.contactPerson}</div>
              </div>
            )}

            {/* Address Information */}
            {selectedCustomer.address && (
              <div className="pt-2 border-t">
                <span className="font-medium text-muted-foreground text-sm">Address:</span>
                <div className="text-sm mt-1">
                  <div className="break-words">{selectedCustomer.address}</div>
                  {(selectedCustomer.city || selectedCustomer.state || selectedCustomer.postalCode) && (
                    <div className="text-muted-foreground break-words">
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
                <div className="space-y-2 mt-1">
                  {selectedCustomer.paymentTerms && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Payment Terms:</span>
                      <div>{selectedCustomer.paymentTerms}</div>
                    </div>
                  )}
                  {selectedCustomer.creditLimit && (
                    <CustomerCreditStatus customer={selectedCustomer} />
                  )}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {(selectedCustomer.orders?.length || selectedCustomer.billingStatements?.length) && (
              <div className="pt-2 border-t">
                <span className="font-medium text-muted-foreground text-sm">Recent Activity:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-1">
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                    <div>
                      <span className="font-medium">Last Order:</span>
                      <div className="text-muted-foreground break-words">
                        {selectedCustomer.orders[0].orderNumber} - ₱{selectedCustomer.orders[0].totalAmount.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {selectedCustomer.billingStatements && selectedCustomer.billingStatements.length > 0 && (
                    <div>
                      <span className="font-medium">Last Billing:</span>
                      <div className="text-muted-foreground break-words">
                        {selectedCustomer.billingStatements[0].statementNumber} - ₱{selectedCustomer.billingStatements[0].totalAmount.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-population Notice */}
      {selectedCustomer && validation.isValid && (
        <Alert role="status" aria-live="polite">
          <AlertDescription className="text-sm">
            <strong>Auto-populated:</strong> Customer name and details will be automatically filled in the billing form. 
            You can manually add invoice items for this customer.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}