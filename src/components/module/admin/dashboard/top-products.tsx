"use client";

// src/components/module/admin/dashboard/top-products.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getTopPerformingProducts } from "@/lib/actions/dashboard";
import { ProductPerformance } from "@/types/admin/dashboard";
import { TrendingUp } from "lucide-react";

export function TopProducts() {
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getTopPerformingProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching top products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Best selling products by revenue</CardDescription>
          </div>
          <TrendingUp className="h-5 w-5 text-blue-500" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No product data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    {product.name}
                    <div className="text-xs text-muted-foreground">
                      {product.sku}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {product.salesCount}
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(product.revenue.toString()).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(product.profit.toString()).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.profitMargin.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
