import { Metadata } from "next";
import {
  getInspectors,
  getDepartments,
  getSpecializations,
} from "@/lib/actions/inspector";
import { InspectorManagement } from "@/components/module/admin/inspectors/inspector-management";
import { CreateInspectorDialog } from "@/components/module/admin/inspectors/create-inspector-dialog";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Inspectors",
  description: "Manage and monitor your inspection personnel",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/inspectors");
}

export default async function InspectorsPage() {
  // Fetch data for the inspectors page
  const inspectors = await getInspectors();
  const departments = await getDepartments();
  const specializations = await getSpecializations();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page Header - Following Sales Invoices Pattern */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inspectors</h2>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your quality inspection personnel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateInspectorDialog
            departments={departments}
            specializations={specializations}
            onSuccess={refreshData}
          />
        </div>
      </div>

      <InspectorManagement data={inspectors} />
    </div>
  );
}
