"use client";

import { useState } from "react";
import { BillingTypeSelector } from "@/components/module/admin/billing/billing-type-selector";
import { BillingTypeId } from "@/types/admin/billing-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BillingTypeSelectorDemo() {
  const [selectedType, setSelectedType] = useState<BillingTypeId | undefined>();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleTypeSelect = (type: BillingTypeId) => {
    setSelectedType(type);
    console.log('Selected billing type:', type);
  };

  const handleReset = () => {
    setSelectedType(undefined);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Type Selector Demo</CardTitle>
          <p className="text-sm text-muted-foreground">
            This demo shows the new billing type selection component in action.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!selectedType}
            >
              Reset Selection
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDisabled(!isDisabled)}
            >
              {isDisabled ? 'Enable' : 'Disable'} Selector
            </Button>
          </div>
          
          {selectedType && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                ✅ Selected: {selectedType}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <BillingTypeSelector
        selectedType={selectedType}
        onTypeSelect={handleTypeSelect}
        disabled={isDisabled}
      />

      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Based on your selection of <strong>{selectedType}</strong>, the next step would be to show the appropriate customer selection form.
            </p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                🚧 This is where the enhanced customer selection components will be implemented in the next task.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}