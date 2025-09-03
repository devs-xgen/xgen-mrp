"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  ShoppingCart, 
  Edit3, 
  Calendar, 
  DollarSign, 
  FileText,
  CreditCard,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { CustomerSelectionData } from "./customer-selection-step";
import { BillingDetailsData } from "./billing-details-step";

interface ReviewStepProps {
  customerSelectionData: CustomerSelectionData;
  billingDetailsData: BillingDetailsData;
}

export function ReviewStep({
  customerSelectionData,
  billingDetailsData,
}: ReviewStepProps) {
  // Calculate derived values
  const taxAmount = (billingDetailsData.subtotal * billingDetailsData.taxRate) / 100;
  const totalAmount = billingDetailsData.subtotal + taxAmount - billingDetailsData.discountAmount;

  const getCustomerInfo = () => {
    switch (customerSelectionData.sourceType) {
      case "manual":
        return {
          name: customerSelectionData.selectedCustomer?.name || "",
          type: "Existing Customer",
          icon: User,
          details: customerSelectionData.selectedCustomer ? [
            { label: "Customer Code", value: customerSelectionData.selectedCustomer.code },
            { label: "Contact Person", value: customerSelectionData.selectedCustomer.contactPerson },
            { label: "Email", value: customerSelectionData.selectedCustomer.email },
            { label: "Phone", value: customerSelectionData.selectedCustomer.phone },
            { label: "Payment Terms", value: customerSelectionData.selectedCustomer.paymentTerms || "N/A" },
          ] : [],
        };
      case "customer_order":
        return {
          name: customerSelectionData.selectedCustomerOrder?.customer.name || "",
          type: "Customer Order",
          icon: ShoppingCart,
          details: customerSelectionData.selectedCustomerOrder ? [
            { label: "Order Number", value: customerSelectionData.selectedCustomerOrder.orderNumber },
            { label: "Order Date", value: format(new Date(customerSelectionData.selectedCustomerOrder.orderDate), "PPP") },
            { label: "Order Amount", value: `₱${customerSelectionData.selectedCustomerOrder.totalAmount.toLocaleString()}` },
            { label: "Order Status", value: customerSelectionData.selectedCustomerOrder.status },
            { label: "Customer Email", value: customerSelectionData.selectedCustomerOrder.customer.email || "N/A" },
            { label: "Customer Phone", value: customerSelectionData.selectedCustomerOrder.customer.phone || "N/A" },
          ] : [],
        };
      case "manual_input":
        return {
          name: customerSelectionData.manualCustomerName || "",
          type: "Manual Entry",
          icon: Edit3,
          details: [
            { label: "Entry Type", value: "New customer name" },
            { label: "Note", value: "This will create a billing statement with manually entered customer information" },
          ],
        };
      default:
        return {
          name: "",
          type: "",
          icon: User,
          details: [],
        };
    }
  };

  const customerInfo = getCustomerInfo();
  const IconComponent = customerInfo.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Confirm</h2>
        <p className="text-muted-foreground">
          Please review all the information before creating the billing statement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconComponent className="w-5 h-5" />
              <span>Customer Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{customerInfo.name}</h3>
              <Badge variant="outline">{customerInfo.type}</Badge>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              {customerInfo.details.map((detail, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{detail.label}:</span>
                  <span className="font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Billing Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₱{billingDetailsData.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({billingDetailsData.taxRate}%):</span>
                <span>₱{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span>-₱{billingDetailsData.discountAmount.toLocaleString()}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Amount:</span>
                <span>₱{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Terms:</span>
              <span className="font-medium">{billingDetailsData.paymentTerms || "Not specified"}</span>
            </div>
            {billingDetailsData.dueDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium">{format(billingDetailsData.dueDate, "PPP")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Additional Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billingDetailsData.notes ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Notes:</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{billingDetailsData.notes}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No additional notes provided.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Ready to Create</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-semibold">{customerInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold text-lg">₱{totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-semibold">
                {billingDetailsData.dueDate 
                  ? format(billingDetailsData.dueDate, "MMM dd, yyyy")
                  : "Not set"
                }
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-background rounded-lg border">
            <p className="text-sm text-muted-foreground text-center">
              Click &quot;Create Billing Statement&quot; to generate the billing statement with the above information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}