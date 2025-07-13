import { DeliveryAssignment } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define the props interface directly in this file
interface DeliveryDashboardProps {
  assignments: any[]; // Use any[] to accept the data structure from getDeliveryAssignments
}

// Helper function to safely format dates
function formatDate(dateValue: any): string {
  if (!dateValue) return "Not scheduled";
  
  try {
    const date = new Date(dateValue);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    return format(date, "PPP");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

export function DeliveryDashboard({ assignments }: DeliveryDashboardProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {assignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{assignment.productionOrder.product.name}</span>
              <Badge
                variant={
                  assignment.status === "PENDING" ? "secondary" : "default"
                }
              >
                {assignment.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              Order #{assignment.productionOrder.customerOrder?.id || "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Customer</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.productionOrder.customerOrder?.customer.name ||
                    "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Delivery Address</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.productionOrder.customerOrder?.shippingAddress ||
                    "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Scheduled Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(assignment.scheduledDate)}
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href={`/delivery/orders/${assignment.id}`}>
                  View Details
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {assignments.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">
            No delivery assignments found.
          </p>
        </div>
      )}
    </div>
  );
}
