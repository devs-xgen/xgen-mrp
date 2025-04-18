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
  title: "Inspectors Management",
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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Inspectors Management
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor your quality inspection personnel
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Inspector-specific dialogs */}
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
