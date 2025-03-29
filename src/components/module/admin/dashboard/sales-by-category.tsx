"use client";

// src/components/module/admin/dashboard/sales-by-category.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { getSalesByCategory } from "@/lib/actions/dashboard";
import { SalesByCategoryData } from "@/types/admin/dashboard";

// Create a new interface for the processed data with number instead of Decimal
interface ProcessedCategoryData {
  categoryId: string;
  categoryName: string;
  salesCount: number;
  revenue: number; // Changed from Decimal to number
  percentage: number;
}

export function SalesByCategoryChart() {
  const [categoryData, setCategoryData] = useState<ProcessedCategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const data = await getSalesByCategory();
        // Process data to convert Decimal objects to numbers for charting
        const processedData: ProcessedCategoryData[] = data.map((item) => ({
          ...item,
          revenue: parseFloat(item.revenue.toString()),
        }));
        setCategoryData(processedData);
      } catch (error) {
        console.error("Error fetching category sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  // Colors for pie chart
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
  ];

  // Custom tooltip formatter
  const formatTooltip = (value: number, name: string, props: any) => {
    return [`$${value.toFixed(2)}`, name];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Category</CardTitle>
        <CardDescription>
          Revenue distribution across product categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : categoryData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No category data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="revenue"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
