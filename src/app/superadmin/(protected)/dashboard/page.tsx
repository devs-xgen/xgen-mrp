import { getSystemMetrics } from "@/lib/actions/superadmin";
import SuperAdminDashboardClient from "@/components/module/superadmin/SuperAdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const metrics = await getSystemMetrics();

  return <SuperAdminDashboardClient metrics={metrics} />;
}
