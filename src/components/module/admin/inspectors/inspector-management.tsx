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

  // Count linked inspectors on component mount
  useEffect(() => {
    const count = data.filter((inspector) => !!inspector.userId).length;
    setLinkedInspectors(count);
  }, [data]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Heading
          title={`Inspectors (${data.length})`}
          description="Manage your quality inspection personnel"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inspectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.filter((i) => i.isActive).length} active inspectors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              User Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkedInspectors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              inspectors linked to user accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Unlinked Inspectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length - linkedInspectors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              inspectors without user accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg mb-6 flex items-center justify-between">
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
          onClick={() => router.push("/admin/users")}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Manage Users
        </Button>
      </div>

      <Separator className="my-4" />

      <DataTable columns={columns} data={data} isLoading={isLoading} />
    </>
  );
}
