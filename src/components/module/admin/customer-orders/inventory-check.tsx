"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { checkInventoryLevels } from "@/lib/actions/customer-order";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku?: string;
  currentStock?: number;
  minimumStockLevel?: number;
}

interface OrderLine {
  productId: string;
  quantity: number;
}

interface ProductionNeed {
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

interface InventoryCheckProps {
  products: Product[];
  canCreateProduction: boolean;
  onCreateProductionOrders?: (productsNeeded: ProductionNeed[]) => void;
}

export function InventoryCheck({
  products,
  canCreateProduction,
  onCreateProductionOrders,
}: InventoryCheckProps) {
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [inventoryResults, setInventoryResults] = useState<ProductionNeed[]>(
    []
  );
  const { toast } = useToast();

  const handleCheckInventory = async () => {
    try {
      setLoading(true);

      // In a real component, orderLines would come from a form input or props
      // This is just a sample implementation
      const sampleOrderLines = products.slice(0, 3).map((product) => ({
        productId: product.id,
        quantity: (product.currentStock || 10) + 5, // Order more than current stock for demo
      }));

      // Use the helper function to check inventory levels
      const results = await checkInventoryLevels(sampleOrderLines);
      setInventoryResults(results);

      if (results.length === 0) {
        toast({
          title: "No Production Needed",
          description: "All products have sufficient inventory levels",
        });
      } else {
        toast({
          title: "Inventory Check Complete",
          description: `Found ${results.length} products that need production orders`,
        });
      }
    } catch (error) {
      console.error("Error checking inventory levels:", error);
      toast({
        title: "Error",
        description: "Failed to check inventory levels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrders = () => {
    if (!onCreateProductionOrders || inventoryResults.length === 0) return;

    try {
      onCreateProductionOrders(inventoryResults);
      toast({
        title: "Production Orders",
        description: "Creating production orders...",
      });
    } catch (error) {
      console.error("Error creating production orders:", error);
      toast({
        title: "Error",
        description: "Failed to create production orders",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Planning</CardTitle>
        <CardDescription>
          Check if your order requires production orders to be created
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>
            Use this tool to analyze your current orders and inventory levels.
            The system will identify products that need production orders based
            on:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Insufficient stock to fulfill orders</li>
            <li>Stock levels dropping below minimum threshold</li>
          </ul>

          {loading && (
            <div className="py-12 flex justify-center items-center">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Analyzing inventory levels...
                </p>
              </div>
            </div>
          )}

          {!loading && inventoryResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Production Needs:</h3>
              {inventoryResults.map((item) => (
                <div
                  key={item.product.id}
                  className="border rounded-md p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.product.name}</h4>
                      {item.product.sku && (
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.product.sku}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        item.reason === "INSUFFICIENT_STOCK"
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {item.reason === "INSUFFICIENT_STOCK"
                        ? "Insufficient Stock"
                        : "Below Minimum Level"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current Stock</p>
                      <p className="font-medium">{item.product.currentStock}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Minimum Level</p>
                      <p className="font-medium">
                        {item.product.minimumStockLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Need to Produce</p>
                      <p className="font-medium">{item.requiredQuantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && inventoryResults.length === 0 && (
            <div className="py-8 flex justify-center items-center">
              <div className="text-center">
                <Check className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-muted-foreground">
                  No inventory check results yet. Click the button below to
                  check.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleCheckInventory}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Inventory Levels"
          )}
        </Button>

        {inventoryResults.length > 0 && canCreateProduction && (
          <Button
            onClick={handleCreateOrders}
            disabled={!onCreateProductionOrders}
          >
            Create Production Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
