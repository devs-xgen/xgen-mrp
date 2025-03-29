"use client";

// src/components/module/admin/dashboard/material-utilization.tsx
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
import { getMaterialUtilization } from "@/lib/actions/dashboard";
import { MaterialUtilization as MaterialUtilizationType } from "@/types/admin/dashboard";
import { Recycle } from "lucide-react";

export function MaterialUtilization() {
  const [materials, setMaterials] = useState<MaterialUtilizationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await getMaterialUtilization();
        setMaterials(data);
      } catch (error) {
        console.error("Error fetching material utilization:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Material Utilization</CardTitle>
            <CardDescription>
              Wastage analysis for top materials
            </CardDescription>
          </div>
          <Recycle className="h-5 w-5 text-green-500" />
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
        ) : materials.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No material utilization data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Wastage %</TableHead>
                <TableHead className="text-right">Cost Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.slice(0, 5).map((material) => (
                <TableRow key={material.materialId}>
                  <TableCell className="font-medium">
                    {material.materialName}
                  </TableCell>
                  <TableCell className="text-right">
                    {material.planned.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {material.actual.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        material.wastagePercentage > 10
                          ? "text-red-500"
                          : "text-amber-500"
                      }
                    >
                      {material.wastagePercentage.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(material.costImpact.toString()).toFixed(2)}
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
