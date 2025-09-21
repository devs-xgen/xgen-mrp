// src/components/module/admin/dashboard/top-materials-consumption-chart.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { getTopMaterialsByConsumption } from "@/lib/actions/dashboard";

type Row = { id: string; name: string; sku: string | null; total: number };

export function TopMaterialsConsumptionChart({ limit = 10, lookbackDays = 60 }: { limit?: number; lookbackDays?: number }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getTopMaterialsByConsumption(limit, lookbackDays);
        if (!mounted) return;
        setRows(data);
      } catch (e) {
        console.error("Failed to load top materials by consumption", e);
        if (!mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [limit, lookbackDays]);

  const chartData = rows.map((r) => ({ label: r.name, value: r.total }));
  const colors = ["#475569", "#334155", "#1f2937", "#64748b", "#94a3b8", "#0ea5e9", "#14b8a6", "#a78bfa", "#f59e0b", "#ef4444"];
  const truncate = (s: string, n = 18) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

  return (
    <Card className="bg-card border rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Top Materials by Consumption</CardTitle>
        <CardDescription>Most consumed materials (last {lookbackDays} days)</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-[360px] w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center">No data for this period</div>
        ) : (
          <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={90} outerRadius={130} paddingAngle={2}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0];
                      return (
                        <div style={{
                          background: "hsl(var(--popover))",
                          color: "hsl(var(--popover-foreground))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          padding: "8px 10px",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>{p && (p.payload as any).label}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <span style={{ opacity: 0.85 }}>Quantity</span>
                            <span style={{ fontWeight: 600 }}>{p && p.value}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  wrapperStyle={{ color: "#cbd5e1", fontSize: 12, paddingLeft: 8 }}
                  formatter={(value: string) => truncate(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
