"use client";

import { useState, useEffect } from "react";
import { Search, User, Mail, Phone, MapPin, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/types/admin/billing";

interface DirectCustomerSelectorProps {
  customers: Customer[];
  selectedCustomer?: Customer;
  onCustomerSelect: (customer: Customer) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
}

export function DirectCustomerSelector({
  customers,
  selectedCustomer,
  onCustomerSelect,
  onClear,
  disabled = false,
  className = "",
}: DirectCustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter((customer) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower) ||
        (customer.code && customer.code.toLowerCase().includes(searchLower))
      );
    });

    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onClear();
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone, or customer code..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="pl-10"
          disabled={disabled}
        />
        {selectedCustomer && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selected Customer Preview */}
      {selectedCustomer && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <User className="mr-2 h-4 w-4" />
                Selected Customer
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{selectedCustomer.name}</span>
                {selectedCustomer.status && (
                  <Badge variant={selectedCustomer.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {selectedCustomer.status}
                  </Badge>
                )}
              </div>
              
              {selectedCustomer.code && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Customer Code: {selectedCustomer.code}
                </div>
              )}
              
              {selectedCustomer.email && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {selectedCustomer.email}
                </div>
              )}
              
              {selectedCustomer.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  {selectedCustomer.phone}
                </div>
              )}
              
              {selectedCustomer.address && (
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <div>{selectedCustomer.address}</div>
                    {(selectedCustomer.city || selectedCustomer.state || selectedCustomer.country) && (
                      <div>
                        {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.country]
                          .filter(Boolean)
                          .join(", ")}
                        {selectedCustomer.postalCode && ` ${selectedCustomer.postalCode}`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedCustomer.tinNumber && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    TIN: {selectedCustomer.tinNumber}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dropdown Results */}
      {isDropdownOpen && !selectedCustomer && (
        <Card className="absolute z-50 w-full max-h-96 overflow-y-auto border shadow-lg">
          <CardContent className="p-0">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? "No customers found matching your search" : "No customers available"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleCustomerSelect(customer)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                    disabled={disabled}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{customer.name}</span>
                        {customer.status && (
                          <Badge 
                            variant={customer.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {customer.status}
                          </Badge>
                        )}
                      </div>
                      
                      {customer.code && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CreditCard className="mr-2 h-3 w-3" />
                          {customer.code}
                        </div>
                      )}
                      
                      {customer.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-2 h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                      
                      {customer.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-2 h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}