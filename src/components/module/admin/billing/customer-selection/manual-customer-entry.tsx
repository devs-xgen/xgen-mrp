"use client";

import { useState } from "react";
import { Edit, User, Mail, Phone, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ManualCustomerDetails {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface ManualCustomerEntryProps {
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  customerDetails?: ManualCustomerDetails;
  onCustomerDetailsChange?: (details: ManualCustomerDetails) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
  showAdditionalFields?: boolean;
}

export function ManualCustomerEntry({
  customerName,
  onCustomerNameChange,
  customerDetails,
  onCustomerDetailsChange,
  onClear,
  disabled = false,
  className = "",
  showAdditionalFields = true,
}: ManualCustomerEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localDetails, setLocalDetails] = useState<ManualCustomerDetails>({
    name: customerName,
    email: customerDetails?.email || "",
    phone: customerDetails?.phone || "",
    address: customerDetails?.address || "",
  });

  const handleNameChange = (name: string) => {
    onCustomerNameChange(name);
    const updatedDetails = { ...localDetails, name };
    setLocalDetails(updatedDetails);
    onCustomerDetailsChange?.(updatedDetails);
  };

  const handleDetailChange = (field: keyof ManualCustomerDetails, value: string) => {
    const updatedDetails = { ...localDetails, [field]: value };
    setLocalDetails(updatedDetails);
    onCustomerDetailsChange?.(updatedDetails);
  };

  const handleClear = () => {
    onClear();
    setLocalDetails({
      name: "",
      email: "",
      phone: "",
      address: "",
    });
    setIsExpanded(false);
  };

  const hasAdditionalDetails = localDetails.email || localDetails.phone || localDetails.address;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Customer Name Input */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              Manual Customer Entry
            </CardTitle>
            {customerName && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-customer-name" className="text-sm font-medium">
              Customer Name *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="manual-customer-name"
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="pl-10"
                disabled={disabled}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the customer name manually. This will be used for billing purposes.
            </p>
          </div>

          {/* Additional Fields Toggle */}
          {showAdditionalFields && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between p-2 h-auto"
                  disabled={disabled}
                >
                  <span className="text-sm">
                    Additional Customer Details {hasAdditionalDetails && "(Optional)"}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-customer-email" className="text-sm">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="manual-customer-email"
                        type="email"
                        placeholder="customer@example.com"
                        value={localDetails.email}
                        onChange={(e) => handleDetailChange("email", e.target.value)}
                        className="pl-10"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manual-customer-phone" className="text-sm">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="manual-customer-phone"
                        type="tel"
                        placeholder="+63 XXX XXX XXXX"
                        value={localDetails.phone}
                        onChange={(e) => handleDetailChange("phone", e.target.value)}
                        className="pl-10"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manual-customer-address" className="text-sm">
                    Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="manual-customer-address"
                      placeholder="Enter customer address..."
                      value={localDetails.address}
                      onChange={(e) => handleDetailChange("address", e.target.value)}
                      className="pl-10 min-h-[80px]"
                      disabled={disabled}
                    />
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <p className="font-medium mb-1">Note:</p>
                  <p>
                    These additional details are optional and will be stored with the billing statement 
                    for reference. They won't create a permanent customer record in your database.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Customer Summary Preview */}
      {customerName && (
        <Card className="border-muted bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Customer Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{customerName}</span>
                <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  Manual Entry
                </span>
              </div>
              
              {localDetails.email && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {localDetails.email}
                </div>
              )}
              
              {localDetails.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  {localDetails.phone}
                </div>
              )}
              
              {localDetails.address && (
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{localDetails.address}</span>
                </div>
              )}
              
              {!hasAdditionalDetails && (
                <p className="text-xs text-muted-foreground">
                  Only customer name will be used for billing.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}