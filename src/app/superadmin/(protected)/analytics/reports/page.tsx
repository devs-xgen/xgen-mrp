import { Metadata } from "next";
import { ReportBuilderClient } from "@/components/module/superadmin/analytics/reports";

export const metadata: Metadata = {
  title: "Report Builder | SuperAdmin Analytics",
  description: "Create custom reports with drag-and-drop fields, filters, and export options",
};

export default function ReportBuilderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Report Builder</h1>
        <p className="text-muted-foreground mt-2">
          Create custom reports with drag-and-drop fields, filters, and multiple export formats
        </p>
      </div>

      <ReportBuilderClient />
    </div>
  );
}
