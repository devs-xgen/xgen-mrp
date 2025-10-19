import { Suspense } from "react";
import { CustomerOrderCreateWizard } from "@/components/module/superadmin/customer-orders/create/CustomerOrderCreateWizard";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Create Customer Order | SuperAdmin",
  description: "Create a new customer order with SuperAdmin overrides",
};

async function CreateOrderContent() {
  // Load customers, products, and tenants
  const [customers, products, tenants] = await Promise.all([
    prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.product.findMany({
      where: {
        archivedAt: null,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        sellingPrice: true,
        currentStock: true,
        variants: {
          where: {
            archivedAt: null,
          },
          select: {
            id: true,
            displayName: true,
            sku: true,
            sellingPrice: true,
            currentStock: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  // Serialize Decimals
  const serializedProducts = products.map(p => ({
    ...p,
    sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : 0,
    currentStock: p.currentStock ? Number(p.currentStock) : 0,
    variants: p.variants.map(v => ({
      ...v,
      sellingPrice: v.sellingPrice ? Number(v.sellingPrice) : 0,
      currentStock: v.currentStock ? Number(v.currentStock) : 0,
    })),
  }));

  return (
    <CustomerOrderCreateWizard
      customers={customers}
      products={serializedProducts}
      tenants={tenants}
    />
  );
}

export default function CreateCustomerOrderPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Customer Order</h2>
          <p className="text-muted-foreground">
            Create a new customer order with SuperAdmin override capabilities
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        }
      >
        <CreateOrderContent />
      </Suspense>
    </div>
  );
}
