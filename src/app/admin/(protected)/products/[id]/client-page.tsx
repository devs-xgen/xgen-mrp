// src/app/admin/(protected)/products/[id]/client-page.tsx
"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductDetails } from "@/components/module/admin/products/product-details";
import { CreateProductionDialog } from "@/components/module/admin/products/create-production-dialog";
import {
  ProductionOrderSummary,
  ProductWithNumberValues,
} from "@/types/admin/product";

interface WorkCenter {
  id: string;
  name: string;
  capacityPerHour: number;
}

interface ProductDetailClientPageProps {
  params: {
    id: string;
  };
  product: ProductWithNumberValues; // Use the type that guarantees number values
  workCenters: WorkCenter[]; // Using WorkCenter type
}

export default function ProductDetailClientPage({
  params,
  product,
  workCenters,
}: ProductDetailClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showProductionDialog, setShowProductionDialog] = useState(false);

  // Check if we should open the production dialog automatically
  useEffect(() => {
    if (searchParams.get("action") === "produce") {
      setShowProductionDialog(true);
    }
  }, [searchParams]);

  // This is a client component wrapper around the server-fetched data
  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/products/${params.id}/edit`}>
            <Button variant="outline">Edit Product</Button>
          </Link>
          <CreateProductionDialog
            product={product}
            workCenters={workCenters}
            open={showProductionDialog}
            onOpenChange={setShowProductionDialog}
          />
        </div>
      </div>

      <ProductDetails product={product} />

      {product.currentStock <= product.minimumStockLevel && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-2">
          <h3 className="text-amber-800 font-medium">Low Stock Alert</h3>
          <p className="text-amber-700 text-sm mt-1">
            Current stock ({product.currentStock}) is below the minimum level (
            {product.minimumStockLevel}). Consider creating a production order
            to replenish inventory.
          </p>
          <div className="mt-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowProductionDialog(true)}
            >
              Create Production Order
            </Button>
          </div>
        </div>
      )}

      {/* Production History */}
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-4">Production History</h2>
        {product.productionOrders && product.productionOrders.length > 0 ? (
          <div className="space-y-2">
            {product.productionOrders.map((order: ProductionOrderSummary) => (
              <div
                key={order.id}
                className="border rounded-md p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">Order #{order.id.slice(-6)}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {order.quantity} • Due:{" "}
                    {new Date(order.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/production/${order.id}`)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No production orders found for this product.
          </p>
        )}
        <div className="mt-4">
          <Link href={`/admin/production?productId=${params.id}`}>
            <Button variant="outline">View All Production Orders</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
