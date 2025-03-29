"use client";

// src/components/module/admin/dashboard/monthly-sales-chart.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { getMonthlySales } from "@/lib/actions/dashboard";
import { MonthlySalesData } from "@/types/admin/dashboard";
import { CURRENCY_SYMBOLS } from "@/lib/constant";

// Interface for the chart data with proper types
interface ChartData {
  month: string;
  year: number;
  revenue: number; // Converted from string to number for the chart
  orders: number;
}

export function MonthlySalesChart() {
  const [salesData, setSalesData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const data = await getMonthlySales();
        // Process data to convert string revenue to numbers for charting
        const processedData = data.map((item) => ({
          ...item,
          revenue: parseFloat(item.revenue),
        }));
        setSalesData(processedData);
      } catch (error) {
        console.error("Error fetching monthly sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  // Custom tooltip formatter for the chart
  const formatTooltip = (value: number) => {
    return `${CURRENCY_SYMBOLS.PESO}${value.toFixed(2)}`;
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Monthly Sales</CardTitle>
        <CardDescription>
          Revenue trends over the past 12 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={salesData}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="month"
                tickFormatter={(value, index) => {
                  if (index >= 0 && index < salesData.length) {
                    return `${value} ${
                      salesData[index]?.year?.toString().slice(-2) || ""
                    }`;
                  }
                  return value;
                }}
              />
              <YAxis
                tickFormatter={(value) => `${CURRENCY_SYMBOLS.PESO}${value}`}
              />
              <Tooltip
                formatter={formatTooltip}
                labelFormatter={(label, items) => {
                  if (!items || items.length === 0 || !items[0]?.payload) {
                    return label;
                  }

                  const payload = items[0].payload;
                  if (payload && typeof payload.year === "number") {
                    return `${label} ${payload.year}`;
                  }

                  return label;
                }}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="orders"
                name="Orders"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
