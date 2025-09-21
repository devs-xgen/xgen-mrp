// src/components/module/admin/dashboard/workflow-quick-actions.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Package, Factory } from "lucide-react";

export function WorkflowQuickActions() {
  return (
    <Card className="bg-card border rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>
          Manage your manufacturing workflow configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/work-centers">
              <Settings className="mr-2 h-4 w-4" />
              Configure Work Centers
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/materials">
              <Package className="mr-2 h-4 w-4" />
              Manage Materials
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/products">
              <Factory className="mr-2 h-4 w-4" />
              Manage Products
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
