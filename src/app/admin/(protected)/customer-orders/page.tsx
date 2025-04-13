"use client";

// src/app/admin/(protected)/customer-orders/page.tsx
import { DataTable } from "@/components/module/admin/customer-orders/data-table";
import { columns } from "@/components/module/admin/customer-orders/columns";
import { CreateCustomerOrderDialog } from "@/components/module/admin/customer-orders/create-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { getProductsForOrders } from "@/lib/actions/product";
import { getAllCustomers } from "@/lib/actions/customers";
import { getWorkCenters } from "@/lib/actions/work-center";
import { InventoryCheck } from "@/components/module/admin/customer-orders/inventory-check";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { createProductionOrder } from "@/lib/actions/production-order";
import { Priority, Status } from "@prisma/client";
import { CustomerOrder } from "@/types/admin/customer-order";
import { ProductForOrder } from "@/types/admin/product";
import { Loader2 } from "lucide-react";

// Define types for customers and work centers
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string | null;
}

interface WorkCenter {
  id: string;
  name: string;
  status: Status;
  efficiencyRate: number;
  capacityPerHour: number;
  operatingHours: number;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

interface ProductNeeded {
  product: {
    id: string;
    name: string;
    sku?: string;
    currentStock: number;
    minimumStockLevel: number;
    leadTime?: number;
  };
  requiredQuantity: number;
  reason: string;
}

export default function CustomerOrdersPage() {
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [productsForOrders, setProductsForOrders] = useState<ProductForOrder[]>(
    []
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersData, productsData, customersData, workCentersData] =
          await Promise.all([
            getCustomerOrders(),
            getProductsForOrders(),
            getAllCustomers(),
            getWorkCenters(),
          ]);

        setCustomerOrders(ordersData);
        setProductsForOrders(productsData);
        setCustomers(customersData);

        // Convert Decimal to number in work centers data
        const formattedWorkCenters = workCentersData.map((wc) => ({
          ...wc,
          efficiencyRate: Number(wc.efficiencyRate),
        }));
        setWorkCenters(formattedWorkCenters);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Convert the products to include stock information with realistic demo values
  const productsWithStock = productsForOrders.map((product, index) => ({
    ...product,
    // Generate some demo stock values for the demo (in real app these would come from DB)
    currentStock: 10 + (index % 5) * 5,
    minimumStockLevel: 5 + (index % 3) * 2,
    sku: `SKU-${product.id?.substring(0, 5) || index}`,
  }));

  const handleCreateProductionOrders = async (
    productsNeeded: ProductNeeded[]
  ) => {
    try {
      // Implementation for creating production orders from client component
      console.log("Creating production orders for:", productsNeeded);

      // Example implementation for creating production orders
      if (!workCenters.length) {
        console.error("No work centers available");
        return;
      }

      const defaultWorkCenter = workCenters[0];

      for (const item of productsNeeded) {
        const startDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // Due in two weeks

        try {
          const result = await createProductionOrder({
            productId: item.product.id,
            quantity: item.requiredQuantity,
            startDate,
            dueDate,
            priority: Priority.HIGH,
            notes: `Created from inventory check - Reason: ${item.reason}`,
            operations: [
              {
                workCenterId: defaultWorkCenter.id,
                startTime: startDate,
                endTime: dueDate,
                cost: 0, // Default cost
              },
            ],
          });

          console.log("Created production order:", result);
        } catch (error) {
          console.error(
            `Failed to create production order for ${item.product.name}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error creating production orders:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Loading customer orders...
          </h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Orders</h2>
          <p className="text-muted-foreground">
            Manage and track all customer orders
          </p>
        </div>
        <CreateCustomerOrderDialog
          products={productsForOrders}
          customers={customers}
          workCenters={workCenters}
        />
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>All Customer Orders</CardTitle>
              <CardDescription>
                A list of all customer orders and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={customerOrders} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="grid md:grid-cols-1 gap-6">
            <InventoryCheck
              products={productsWithStock}
              canCreateProduction={workCenters.length > 0}
              onCreateProductionOrders={handleCreateProductionOrders}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
