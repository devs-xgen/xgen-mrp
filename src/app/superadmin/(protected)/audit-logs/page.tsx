import { getAuditLogStats } from "@/lib/actions/superadmin/audit-logs"
import AuditLogsClient from "@/components/module/superadmin/audit-logs/audit-logs-client"

export const dynamic = "force-dynamic";

export default async function SuperAdminAuditLogsPage() {
  const stats = await getAuditLogStats()

  return <AuditLogsClient stats={stats} />
}
