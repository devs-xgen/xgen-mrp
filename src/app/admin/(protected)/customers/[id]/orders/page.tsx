import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getCustomerById, 
  getCustomerOrdersByCustomerId, 
  getProductionOrdersByCustomerId 
} from "@/lib/actions/customers";

interface CustomerOrdersPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CustomerOrdersPageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const customer = await getCustomerById(id);
    return {
      title: `${customer.name} - Orders`,
      description: "View customer orders and production orders",
    };
  } catch (error) {
    return {
      title: "Customer Orders",
      description: "View customer orders and production orders",
    };
  }
}

export default async function CustomerOrdersPage({ params }: CustomerOrdersPageProps) {
  const { id } = await params;
  
  try {
    // Fetch data
    const [customer, customerOrders, productionOrders] = await Promise.all([
      getCustomerById(id),
      getCustomerOrdersByCustomerId(id),
      getProductionOrdersByCustomerId(id)
    ]);

    if (!customer) {
      notFound();
    }

      return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center space-x-4">
            <Link href="/admin/customers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Customers
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{customer.name} - Orders</h2>
              <p className="text-muted-foreground mt-1">
                View all orders and production orders for this customer
              </p>
            </div>
          </div>
        </div>

        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Code</p>
                <p className="text-sm">{customer.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                <p className="text-sm">{customer.contactPerson}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={customer.status === "ACTIVE" ? "success" : "secondary"}>
                  {customer.status.toLowerCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Tabs */}
        <Tabs defaultValue="customer-orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="customer-orders">
              Customer Orders ({customerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="production-orders">
              Production Orders ({productionOrders.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="customer-orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {customerOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No customer orders found for this customer.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            <p className="text-sm text-muted-foreground">
                              Order Date: {new Date(order.orderDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              order.status === "COMPLETED" ? "success" :
                              order.status === "IN_PROGRESS" ? "default" :
                              order.status === "CANCELLED" ? "destructive" : "secondary"
                            }>
                              {order.status.toLowerCase().replace('_', ' ')}
                            </Badge>
                            <p className="text-sm font-medium mt-1">
                              ₱{order.totalAmount?.toLocaleString() || '0.00'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">
                            Required Date: {new Date(order.requiredDate).toLocaleDateString()}
                          </p>
                          {order.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Notes: {order.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production-orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Production Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {productionOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No production orders found for this customer.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {productionOrders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {order.product?.name || 'Unknown Product'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              SKU: {order.product?.sku || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              order.status === "COMPLETED" ? "success" :
                              order.status === "IN_PROGRESS" ? "default" :
                              order.status === "CANCELLED" ? "destructive" : "secondary"
                            }>
                              {order.status.toLowerCase().replace('_', ' ')}
                            </Badge>
                            <p className="text-sm font-medium mt-1">
                              Qty: {order.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Start Date: {new Date(order.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Due Date: {new Date(order.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {order.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Notes: {order.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Error loading customer orders page:", error);
    notFound();
  }
}
