"use client";

import { useState } from "react";
import { Edit, User, Mail, Phone, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ManualCustomerDetails {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface ManualCustomerEntryProps {
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  customerDetails?: ManualCustomerDetails;
  onCustomerDetailsChange?: (details: ManualCustomerDetails) => void;
  onClear: () => void;
  disabled?: boolean;
  showAdditionalFields?: boolean;
  required?: boolean;
}

export function ManualCustomerEntry({
  customerName,
  onCustomerNameChange,
  customerDetails,
  onCustomerDetailsChange,
  onClear,
  disabled = false,
  showAdditionalFields = true,
  required = true,
}: ManualCustomerEntryProps) {
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [localDetails, setLocalDetails] = useState<ManualCustomerDetails>({
    name: customerName,
    email: customerDetails?.email || "",
    phone: customerDetails?.phone || "",
    address: customerDetails?.address || "",
    city: customerDetails?.city || "",
    state: customerDetails?.state || "",
    postalCode: customerDetails?.postalCode || "",
    country: customerDetails?.country || "",
  });

  const handleNameChange = (value: string) => {
    onCustomerNameChange(value);
    const updatedDetails = { ...localDetails, name: value };
    setLocalDetails(updatedDetails);
    onCustomerDetailsChange?.(updatedDetails);
  };

  const handleDetailChange = (field: keyof ManualCustomerDetails, value: string) => {
    const updatedDetails = { ...localDetails, [field]: value };
    setLocalDetails(updatedDetails);
    onCustomerDetailsChange?.(updatedDetails);
  };

  const handleClear = () => {
    onCustomerNameChange("");
    const clearedDetails: ManualCustomerDetails = {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    };
    setLocalDetails(clearedDetails);
    onCustomerDetailsChange?.(clearedDetails);
    setShowOptionalFields(false);
    onClear();
  };

  const hasOptionalData = localDetails.email || localDetails.phone || localDetails.address;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="manual-customer-name">
          Customer Name {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Edit className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="manual-customer-name"
              placeholder="Enter customer name..."
              value={customerName}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={disabled}
              className="pl-10"
              required={required}
            />
          </div>
          {customerName && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClear}
              disabled={disabled}
              title="Clear customer information"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Customer Preview Card */}
      {customerName && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Manual Customer Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{customerName}</span>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Manual Entry
              </span>
            </div>

            {hasOptionalData && (
              <div className="pt-2 border-t space-y-2 text-sm">
                {localDetails.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{localDetails.email}</span>
                  </div>
                )}
                {localDetails.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{localDetails.phone}</span>
                  </div>
                )}
                {localDetails.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                    <div>
                      <div>{localDetails.address}</div>
                      {(localDetails.city || localDetails.state || localDetails.postalCode) && (
                        <div className="text-muted-foreground text-xs">
                          {[localDetails.city, localDetails.state, localDetails.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                          {localDetails.country && `, ${localDetails.country}`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Optional Additional Fields */}
      {showAdditionalFields && customerName && (
        <Collapsible open={showOptionalFields} onOpenChange={setShowOptionalFields}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              {showOptionalFields ? "Hide" : "Add"} Additional Customer Details
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Optional Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="customer@example.com"
                      value={localDetails.email}
                      onChange={(e) => handleDetailChange('email', e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Phone</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      placeholder="+63 XXX XXX XXXX"
                      value={localDetails.phone}
                      onChange={(e) => handleDetailChange('phone', e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-address">Address</Label>
                  <Textarea
                    id="customer-address"
                    placeholder="Street address..."
                    value={localDetails.address}
                    onChange={(e) => handleDetailChange('address', e.target.value)}
                    disabled={disabled}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-city">City</Label>
                    <Input
                      id="customer-city"
                      placeholder="City"
                      value={localDetails.city}
                      onChange={(e) => handleDetailChange('city', e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-state">State/Province</Label>
                    <Input
                      id="customer-state"
                      placeholder="State/Province"
                      value={localDetails.state}
                      onChange={(e) => handleDetailChange('state', e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-postal">Postal Code</Label>
                    <Input
                      id="customer-postal"
                      placeholder="Postal Code"
                      value={localDetails.postalCode}
                      onChange={(e) => handleDetailChange('postalCode', e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-country">Country</Label>
                  <Input
                    id="customer-country"
                    placeholder="Country"
                    value={localDetails.country}
                    onChange={(e) => handleDetailChange('country', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Manual Entry Notice */}
      {customerName && (
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Manual Entry:</strong> This customer information will be saved with the billing statement. 
            Consider adding this customer to your database for future use.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}