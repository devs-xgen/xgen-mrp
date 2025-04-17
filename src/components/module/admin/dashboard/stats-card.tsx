"use client";

// src/components/module/admin/dashboard/stats-card.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CircleDollarSign,
  PackageOpen,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats } from "@/lib/actions/dashboard";
import { DashboardStats } from "@/types/admin/dashboard";
import { CURRENCY_SYMBOLS } from "@/lib/constant";

// Interface for the processed stats with proper types
interface ProcessedStats {
  totalRevenue: string; // Converted from Decimal to string
  totalProducts: number;
  activeOrders: number;
  totalUsers: number;
  revenueGrowth: string;
  productsGrowth: string;
  ordersGrowth: string;
  usersGrowth: string;
}

export function StatsCards() {
  const [stats, setStats] = useState<ProcessedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        // Convert Decimal to string for safe serialization
        setStats({
          ...data
          // totalRevenue: data.totalRevenue.toString(),
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsConfig = [
    {
      title: "Total Revenue",
      value: stats
        ? `${CURRENCY_SYMBOLS.PESO}${parseFloat(stats.totalRevenue).toFixed(2)}`
        : `${CURRENCY_SYMBOLS.PESO}0.00`,
      icon: CircleDollarSign,
      trend: stats?.revenueGrowth || "+0%",
      trendDirection: stats?.revenueGrowth?.startsWith("+") ? "up" : "down",
    },
    {
      title: "Total Products",
      value: stats ? stats.totalProducts.toString() : "0",
      icon: PackageOpen,
      trend: stats?.productsGrowth || "+0%",
      trendDirection: stats?.productsGrowth?.startsWith("+") ? "up" : "down",
    },
    {
      title: "Active Orders",
      value: stats ? stats.activeOrders.toString() : "0",
      icon: ShoppingCart,
      trend: stats?.ordersGrowth || "+0%",
      trendDirection: stats?.ordersGrowth?.startsWith("+") ? "up" : "down",
    },
    {
      title: "Total Users",
      value: stats ? stats.totalUsers.toString() : "0",
      icon: Users,
      trend: stats?.usersGrowth || "+0%",
      trendDirection: stats?.usersGrowth?.startsWith("+") ? "up" : "down",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p
                  className={`text-xs ${
                    stat.trendDirection === "up"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {stat.trend} from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
