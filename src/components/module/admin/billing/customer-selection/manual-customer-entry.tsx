"use client";

import { useState, useEffect } from "react";
import { Edit, User, Mail, Phone, MapPin, X, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FormFieldError } from "@/components/ui/form-field-error";

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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ManualCustomerEntryProps {
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  customerDetails?: ManualCustomerDetails;
  onCustomerDetailsChange?: (details: ManualCustomerDetails) => void;
  onClear: () => void;
  onValidationChange?: (validation: ValidationResult) => void;
  disabled?: boolean;
  showAdditionalFields?: boolean;
  required?: boolean;
  enablePersistence?: boolean;
  errors?: Record<string, string | string[]>;
}

export function ManualCustomerEntry({
  customerName,
  onCustomerNameChange,
  customerDetails,
  onCustomerDetailsChange,
  onClear,
  onValidationChange,
  disabled = false,
  showAdditionalFields = true,
  required = true,
  enablePersistence = true,
  errors = {},
}: ManualCustomerEntryProps) {
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Validation and formatting functions
  const formatCustomerName = (name: string): string => {
    // Remove extra spaces and capitalize first letter of each word
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const validateCustomerName = (name: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (required && !name.trim()) {
      errors.push('Customer name is required');
    }
    
    if (name.trim() && name.trim().length < 2) {
      errors.push('Customer name must be at least 2 characters long');
    }
    
    if (name.trim() && name.trim().length > 100) {
      errors.push('Customer name must be less than 100 characters');
    }
    
    // Check for invalid characters
    const invalidChars = /[<>{}[\]\\\/]/;
    if (name && invalidChars.test(name)) {
      errors.push('Customer name contains invalid characters');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validateEmail = (email: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Please enter a valid email address');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validatePhone = (phone: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (phone && phone.trim()) {
      // Allow various phone formats
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.push('Please enter a valid phone number');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validateAllFields = (details: ManualCustomerDetails): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate name
    const nameValidation = validateCustomerName(details.name);
    errors.push(...nameValidation.errors);
    
    // Validate email
    if (details.email) {
      const emailValidation = validateEmail(details.email);
      errors.push(...emailValidation.errors);
    }
    
    // Validate phone
    if (details.phone) {
      const phoneValidation = validatePhone(details.phone);
      errors.push(...phoneValidation.errors);
    }
    
    // Business rule warnings
    if (details.name && details.name.trim().length < 5) {
      warnings.push('Customer name seems short - consider adding more details');
    }
    
    if (details.name && !details.email && !details.phone) {
      warnings.push('Consider adding contact information for better record keeping');
    }
    
    if (details.address && (!details.city || !details.state)) {
      warnings.push('Address is incomplete - consider adding city and state');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  // Persistence functions
  const saveToLocalStorage = (details: ManualCustomerDetails) => {
    if (!enablePersistence || !details.name.trim()) return;
    
    try {
      const existingData = localStorage.getItem('manual-customer-entries');
      const entries = existingData ? JSON.parse(existingData) : [];
      
      // Check if customer already exists
      const existingIndex = entries.findIndex((entry: ManualCustomerDetails) => 
        entry.name.toLowerCase() === details.name.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        // Update existing entry
        entries[existingIndex] = { ...details, lastUsed: new Date().toISOString() };
      } else {
        // Add new entry
        entries.push({ ...details, lastUsed: new Date().toISOString() });
      }
      
      // Keep only last 50 entries
      const sortedEntries = entries
        .sort((a: any, b: any) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        .slice(0, 50);
      
      localStorage.setItem('manual-customer-entries', JSON.stringify(sortedEntries));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.warn('Failed to save customer entry to local storage:', error);
    }
  };

  const loadFromLocalStorage = (): ManualCustomerDetails[] => {
    if (!enablePersistence) return [];
    
    try {
      const existingData = localStorage.getItem('manual-customer-entries');
      return existingData ? JSON.parse(existingData) : [];
    } catch (error) {
      console.warn('Failed to load customer entries from local storage:', error);
      return [];
    }
  };

  // Effect to validate on changes
  useEffect(() => {
    const validationResult = validateAllFields(localDetails);
    setValidation(validationResult);
    onValidationChange?.(validationResult);
  }, [localDetails, onValidationChange]);

  const handleNameChange = (value: string) => {
    const formattedName = formatCustomerName(value);
    onCustomerNameChange(formattedName);
    const updatedDetails = { ...localDetails, name: formattedName };
    setLocalDetails(updatedDetails);
    onCustomerDetailsChange?.(updatedDetails);
    setHasUnsavedChanges(true);
  };

  const handleDetailChange = (field: keyof ManualCustomerDetails, value: string) => {
    const updatedDetails = { ...localDetails, [field]: value };
    setLocalDetails(updatedDetails);
    onCustomerDetailsChange?.(updatedDetails);
    setHasUnsavedChanges(true);
  };

  const handleSaveEntry = () => {
    if (localDetails.name.trim()) {
      saveToLocalStorage(localDetails);
    }
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
    setHasUnsavedChanges(false);
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
              className={`pl-10 ${
                validation.errors.length > 0 ? 'border-red-500 focus:border-red-500' : 
                customerName && validation.isValid ? 'border-green-500' : ''
              }`}
              required={required}
            />
            {customerName && validation.isValid && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
            {validation.errors.length > 0 && (
              <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
            )}
          </div>
          {customerName && enablePersistence && hasUnsavedChanges && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleSaveEntry}
              disabled={disabled || !validation.isValid}
              title="Save customer entry for future use"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
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
        
        {/* Field-level validation errors */}
        {(validation.errors.length > 0 || errors.customerName) && (
          <FormFieldError 
            error={validation.errors[0] || errors.customerName} 
          />
        )}
      </div>

      {/* Validation Alerts */}
      {customerName && validation.errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium mb-1">Validation Errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {customerName && validation.warnings.length > 0 && validation.errors.length === 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="font-medium mb-1">Suggestions:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Customer Preview Card */}
      {customerName && (
        <Card className={`${
          validation.errors.length > 0 ? 'bg-red-50 border-red-200' :
          validation.isValid ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Manual Customer Entry
              </div>
              <div className="flex items-center gap-2">
                {validation.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                {hasUnsavedChanges && enablePersistence && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Unsaved
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{customerName}</span>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Manual Entry
              </span>
              {validation.isValid && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Valid
                </span>
              )}
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
                    <div className="relative">
                      <Input
                        id="customer-email"
                        type="email"
                        placeholder="customer@example.com"
                        value={localDetails.email}
                        onChange={(e) => handleDetailChange('email', e.target.value)}
                        disabled={disabled}
                        className={
                          localDetails.email && !validateEmail(localDetails.email).isValid
                            ? 'border-red-500 focus:border-red-500'
                            : localDetails.email && validateEmail(localDetails.email).isValid
                            ? 'border-green-500'
                            : ''
                        }
                      />
                      {localDetails.email && validateEmail(localDetails.email).isValid && (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {localDetails.email && !validateEmail(localDetails.email).isValid && (
                        <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {localDetails.email && !validateEmail(localDetails.email).isValid && (
                      <FormFieldError error={validateEmail(localDetails.email).errors[0]} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Phone</Label>
                    <div className="relative">
                      <Input
                        id="customer-phone"
                        type="tel"
                        placeholder="+63 XXX XXX XXXX"
                        value={localDetails.phone}
                        onChange={(e) => handleDetailChange('phone', e.target.value)}
                        disabled={disabled}
                        className={
                          localDetails.phone && !validatePhone(localDetails.phone).isValid
                            ? 'border-red-500 focus:border-red-500'
                            : localDetails.phone && validatePhone(localDetails.phone).isValid
                            ? 'border-green-500'
                            : ''
                        }
                      />
                      {localDetails.phone && validatePhone(localDetails.phone).isValid && (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {localDetails.phone && !validatePhone(localDetails.phone).isValid && (
                        <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {localDetails.phone && !validatePhone(localDetails.phone).isValid && (
                      <FormFieldError error={validatePhone(localDetails.phone).errors[0]} />
                    )}
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
        <Alert className={validation.isValid ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}>
          <AlertDescription className="text-sm">
            <strong>Manual Entry:</strong> This customer information will be saved with the billing statement.
            {enablePersistence && (
              <span>
                {' '}Customer details are automatically saved locally for future reference.
                {hasUnsavedChanges && ' Click the save button to store the current information.'}
              </span>
            )}
            {!enablePersistence && ' Consider adding this customer to your database for future use.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Persistence Status */}
      {customerName && enablePersistence && !hasUnsavedChanges && validation.isValid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-sm">
            Customer information has been saved for future reference.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}