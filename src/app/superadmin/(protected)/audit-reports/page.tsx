import { Metadata } from "next";
import { AuditReportsClient } from "@/components/module/superadmin/audit";

export const metadata: Metadata = {
  title: "Audit Reports & Compliance | SuperAdmin",
  description: "Generate comprehensive audit reports for compliance and governance",
};

export const dynamic = "force-dynamic";

export default function AuditReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Reports & Compliance</h1>
        <p className="text-muted-foreground mt-2">
          Generate comprehensive audit reports from activity logs for compliance and governance
        </p>
      </div>

      <AuditReportsClient />
    </div>
  );
}
