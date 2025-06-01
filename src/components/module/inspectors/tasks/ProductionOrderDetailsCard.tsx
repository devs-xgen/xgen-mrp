import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Product {
  name?: string;
  sku?: string;
}

interface Operation {
  id: string;
  name?: string;
  title?: string;
  status: string;
}

interface ProductionOrderDetailsProps {
  productionOrder: {
    id: string;
    product?: Product;
    status: string;
    quantity?: number;
    createdAt: string | Date;
    updatedAt: string | Date;
    operations?: Operation[];
  };
}

export function ProductionOrderDetailsCard({ productionOrder }: ProductionOrderDetailsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Order Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">Product</h3>
          <div className="mt-1">{productionOrder.product?.name || "N/A"}</div>
        </div>

        <div>
          <h3 className="font-medium">SKU</h3>
          <div className="mt-1">{productionOrder.product?.sku || "N/A"}</div>
        </div>

        <div>
          <h3 className="font-medium">Status</h3>
          <div className="mt-1">{getStatusBadge(productionOrder.status)}</div>
        </div>

        <div>
          <h3 className="font-medium">Quantity</h3>
          <div className="mt-1">{productionOrder.quantity ?? "N/A"}</div>
        </div>

        <div>
          <h3 className="font-medium">Created At</h3>
          <div className="mt-1">{format(new Date(productionOrder.createdAt), "PPP p")}</div>
        </div>

        <div>
          <h3 className="font-medium">Updated At</h3>
          <div className="mt-1">{format(new Date(productionOrder.updatedAt), "PPP p")}</div>
        </div>

        {productionOrder.operations && productionOrder.operations.length > 0 && (
          <div>
            <h3 className="font-medium">Related Tasks</h3>
            <ul className="list-disc ml-5 mt-1">
              {productionOrder.operations.map((op) => (
                <li key={op.id}>
                  {op.name || op.title || "Unnamed Task"} - Status: {op.status}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
