import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginHistoryTable } from "@/components/module/developer/login-history/login-history-table";
import { LoginStatsCards } from "@/components/module/developer/login-history/login-stats-cards";

export const metadata = {
  title: "Login History | Developer Portal",
  description: "View and analyze login history and statistics",
};

export default async function LoginHistoryPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Login History</h1>
        <p className="text-muted-foreground mt-2">
          Track and analyze user login activity, security events, and access patterns
        </p>
      </div>

      <Suspense fallback={<div>Loading statistics...</div>}>
        <LoginStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Login Records</CardTitle>
          <CardDescription>
            Complete history of all login attempts across all portals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading login history...</div>}>
            <LoginHistoryTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
