// src/app/worker/(protected)/dashboard/page.tsx
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Package, Clock, CheckCircle, PackageCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Inspector Dashboard",
  description: "Your inspection overview",
};

export default function InspectorDashboard() {
  const stats = [
    {
      title: "Inspections Assigned",
      value: "5",
      icon: ClipboardList,
      description: "Inspections assigned to you",
    },
    {
      title: "Ongoing Inspections",
      value: "3",
      icon: Clock,
      description: "Inspections currently in progress",
    },
    {
      title: "Completed Inspections",
      value: "8",
      icon: CheckCircle,
      description: "Inspections completed today",
    },
    {
      title: "Flagged Items",
      value: "4",
      icon: PackageCheck,
      description: "Items needing follow-up",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inspector Dashboard</h2>
        <p className="text-muted-foreground">
          Your inspection overview and current tasks
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Inspections Section */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">Inspection - Production Line #7</h3>
                <p className="text-sm text-muted-foreground">Due in 2 hours</p>
              </div>
              <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                In Progress
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">Routine Safety Check</h3>
                <p className="text-sm text-muted-foreground">
                  Due today at 4:00 PM
                </p>
              </div>
              <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                Pending
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">Storage Compliance Audit</h3>
                <p className="text-sm text-muted-foreground">
                  Due today at 5:30 PM
                </p>
              </div>
              <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                Urgent
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}