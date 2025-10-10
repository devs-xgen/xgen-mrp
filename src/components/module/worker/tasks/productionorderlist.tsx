"use client";

import * as React from "react";
import Link from "next/link";
// Assuming these are locally defined or part of the component system
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Calendar, Tag, Hourglass, CheckCircle, PlayCircle } from "lucide-react";

// --- TYPE DEFINITIONS (Updated to reflect usage) ---
interface ProductionOrder {
  id: string;
  productionOrderNumber: string;
  product: { name: string, sku: string }; 
  productVariant: { sku: string; displayName: string; } | null; // Can be null
  quantity: number;
  completedQuantity: number; // Added based on logic in the detail page
  unitOfMeasure: string;
  status: "ACTIVE" | "PENDING" | "COMPLETED" | "ON_HOLD" | string; // Use string for general safety
  dueDate: string; // ISO Date string
}

interface ProductionOrdersListProps {
  orders: ProductionOrder[];
}

// --- STATUS COLOR MAPPING (Utility) ---
const getStatusBadge = (status: string) => { 
  switch (status) {
    case "ACTIVE":
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active <PlayCircle className="ml-1 h-3 w-3" /></Badge>;
    case "PENDING":
    case "ON_HOLD":
      return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600 text-white">Pending <Hourglass className="ml-1 h-3 w-3" /></Badge>;
    case "COMPLETED":
      return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Completed <CheckCircle className="ml-1 h-3 w-3" /></Badge>;
    case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// --- MAIN COMPONENT ---
export function ProductionOrdersList({ orders }: ProductionOrdersListProps) {
  if (!orders || orders.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No production orders to display.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-3">All Assigned Orders ({orders.length})</h2>
      {orders.map((order) => { 
        const itemName = order.productVariant?.displayName || order.product?.name || "N/A";
        const itemCode = order.productVariant?.sku || order.product?.sku || "N/A";
        const completionPercentage = order.quantity > 0 ? ((order.completedQuantity / order.quantity) * 100).toFixed(0) : '0';
        
        return (
          <Link 
            key={order.id} 
            // Linking to the detail page (using the ID)
            href={`/worker/tasks/${order.id}`} 
            className="block group transition-shadow duration-150 ease-in-out"
          >
            <Card className="hover:shadow-lg hover:border-primary">
              <CardHeader className="p-4 sm:p-6 pb-2 flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">
                    {order.productionOrderNumber}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {itemName} (SKU: {itemCode})
                  </p>
                </div>
                <div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6 pt-2">
                <Separator className="mb-3" />
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  
                  {/* Quantity */}
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Tag className="h-4 w-4 text-indigo-500" /> Required Quantity
                    </div>
                    <p className="font-medium">{order.quantity} {order.unitOfMeasure}</p>
                  </div>

                  {/* Due Date */}
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-indigo-500" /> Due Date
                    </div>
                    <p className="font-medium">
                      {new Date(order.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Progress/Completed Info */}
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-indigo-500" /> Progress
                    </div>
                    <p className="font-semibold text-green-700">{completionPercentage}% Completed</p>
                  </div>

                  {/* View Details Link */}
                  <div className="text-right self-end">
                    <div className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center">
                      View Details <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
