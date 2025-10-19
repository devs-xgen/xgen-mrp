import { Metadata } from "next";
import { SystemHealthClient } from "@/components/module/superadmin/system-health";

export const metadata: Metadata = {
  title: "System Health & Monitoring | SuperAdmin",
  description: "Real-time system health monitoring, performance metrics, error tracking, and alerting",
};

export const dynamic = "force-dynamic";

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Health & Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Real-time monitoring of system health, performance metrics, errors, and alerts
        </p>
      </div>

      <SystemHealthClient />
    </div>
  );
}
