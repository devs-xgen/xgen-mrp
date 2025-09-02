"use client";

import { useState, useEffect } from "react";
import { Inspector } from "@/lib/actions/inspector";
import { DataTable } from "./data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { columns } from "./columns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Link, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InspectorManagementProps {
  data: Inspector[];
  isLoading?: boolean;
}

export function InspectorManagement({
  data,
  isLoading = false,
}: InspectorManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [linkedInspectors, setLinkedInspectors] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Count linked inspectors on component mount
  useEffect(() => {
    const count = data.filter((inspector) => !!inspector.userId).length;
    setLinkedInspectors(count);
  }, [data]);

  const refresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-4">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6 space-x-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">Total Inspectors</p>
                <p className="text-2xl font-bold mt-1">{data.length}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {data.filter((i) => i.isActive).length} active inspectors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6 space-x-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">User Integration</p>
                <p className="text-2xl font-bold mt-1">{linkedInspectors}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  inspectors linked to user accounts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6 space-x-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">Unlinked Inspectors</p>
                <p className="text-2xl font-bold mt-1">
                  {data.length - linkedInspectors}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  inspectors without user accounts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6 space-x-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">Active Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {data.length > 0 ? Math.round((data.filter((i) => i.isActive).length / data.length) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  percentage of active inspectors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Integration Info */}
      <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Link className="h-3 w-3 mr-1" />
            User Integration
          </Badge>
          <p className="text-sm text-muted-foreground">
            Link inspectors to user accounts to allow them to perform quality
            checks. Linked inspectors will appear with a{" "}
            <span className="font-medium">User Linked</span> badge.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          onClick={refresh}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={data} isLoading={isLoading} />
    </div>
  );
}
