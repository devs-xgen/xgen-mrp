"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Calculator, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { CustomerSelectionData } from "./customer-selection-step";

export interface BillingDetailsData {
  subtotal: number;
  taxRate: number;
  discountAmount: number;
  paymentTerms?: string;
  dueDate?: Date;
  notes?: string;
}

interface BillingDetailsStepProps {
  data: BillingDetailsData;
  onChange: (data: BillingDetailsData) => void;
  customerSelectionData: CustomerSelectionData;
}

export function BillingDetailsStep({
  data,
  onChange,
  customerSelectionData,
}: BillingDetailsStepProps) {
  const [dueDateOpen, setDueDateOpen] = useState(false);

  useEffect(() => {
    if (customerSelectionData.sourceType === "manual" && customerSelectionData.selectedCustomer?.paymentTerms) {
      onChange({
        ...data,
        paymentTerms: customerSelectionData.selectedCustomer.paymentTerms,
      });
    } else if (
      customerSelectionData.sourceType === "customer_order" &&
      customerSelectionData.selectedCustomerOrder?.customer.paymentTerms
    ) {
      onChange({
        ...data,
        paymentTerms: customerSelectionData.selectedCustomerOrder.customer.paymentTerms,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerSelectionData]);

  const taxAmount = (data.subtotal * data.taxRate) / 100;
  const totalAmount = data.subtotal + taxAmount - data.discountAmount;

  const handleFieldChange = (field: keyof BillingDetailsData, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const getCustomerInfo = () => {
    switch (customerSelectionData.sourceType) {
      case "manual":
        return customerSelectionData.selectedCustomer;
      case "customer_order":
        return customerSelectionData.selectedCustomerOrder?.customer;
      case "manual_input":
        return { name: customerSelectionData.manualCustomerName } as any;
      default:
        return null;
    }
  };

  const customerInfo = getCustomerInfo();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Billing Details</h2>
        <p className="text-muted-foreground">
          Enter the billing information and financial details for this statement.
        </p>
      </div>

      {customerInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Billing For</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{customerInfo.name}</h3>
                {customerSelectionData.sourceType === "customer_order" && customerSelectionData.selectedCustomerOrder && (
                  <p className="text-sm text-muted-foreground">
                    Order: {customerSelectionData.selectedCustomerOrder.orderNumber} • ₱{customerSelectionData.selectedCustomerOrder.totalAmount.toLocaleString()}
                  </p>
                )}
              </div>
              <Badge variant="outline">
                {customerSelectionData.sourceType === "manual" && "Existing Customer"}
                {customerSelectionData.sourceType === "customer_order" && "Customer Order"}
                {customerSelectionData.sourceType === "manual_input" && "Manual Entry"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calculator className="w-5 h-5" />
              <span>Financial Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subtotal">Subtotal (₱)</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={Number.isFinite(data.subtotal) ? data.subtotal : ""}
                onChange={(e) => handleFieldChange("subtotal", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="12.00"
                value={Number.isFinite(data.taxRate) ? data.taxRate : ""}
                onChange={(e) => handleFieldChange("taxRate", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="discountAmount">Discount Amount (₱)</Label>
              <Input
                id="discountAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={Number.isFinite(data.discountAmount) ? data.discountAmount : ""}
                onChange={(e) => handleFieldChange("discountAmount", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₱{data.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({data.taxRate}%):</span>
                <span>₱{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-₱{data.discountAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total Amount:</span>
                <span>₱{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Terms & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                placeholder="e.g., Net 30, COD, etc."
                value={data.paymentTerms || ""}
                onChange={(e) => handleFieldChange("paymentTerms", e.target.value)}
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !data.dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.dueDate ? format(data.dueDate, "PPP") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.dueDate}
                    onSelect={(date) => {
                      handleFieldChange("dueDate", date || undefined);
                      setDueDateOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or comments..."
                rows={4}
                value={data.notes || ""}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleFieldChange("taxRate", 12)}>
              Set VAT (12%)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFieldChange("taxRate", 0)}>
              No Tax (0%)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                handleFieldChange("dueDate", thirtyDaysFromNow);
                handleFieldChange("paymentTerms", "Net 30");
              }}
            >
              Net 30 Terms
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const fifteenDaysFromNow = new Date();
                fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
                handleFieldChange("dueDate", fifteenDaysFromNow);
                handleFieldChange("paymentTerms", "Net 15");
              }}
            >
              Net 15 Terms
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
