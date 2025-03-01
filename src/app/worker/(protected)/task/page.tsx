// src/app/worker/(protected)/tasks/page.tsx
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "Worker Tasks",
  description: "Manage your assigned tasks",
};

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground">
          View and manage your assigned tasks
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-4">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Inventory Verification</h4>
                  <p className="text-sm text-muted-foreground">Due in 2 days</p>
                </div>
              </div>
              <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                In Progress
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-4">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Quality Check - Batch A123</h4>
                  <p className="text-sm text-muted-foreground">Due today</p>
                </div>
              </div>
              <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                Urgent
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-4">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Material Restocking</h4>
                  <p className="text-sm text-muted-foreground">Due in 5 days</p>
                </div>
              </div>
              <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                Pending
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
