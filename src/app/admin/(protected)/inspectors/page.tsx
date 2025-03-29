import { Metadata } from "next";
import {
  getInspectors,
  getDepartments,
  getSpecializations,
} from "@/lib/actions/inspector";
import { DataTable } from "@/components/module/admin/inspectors/data-table";
import { columns } from "@/components/module/admin/inspectors/columns";
import { CreateInspectorDialog } from "@/components/module/admin/inspectors/create-inspector-dialog";
import { revalidatePath } from "next/cache";

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Inspectors Management
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor your inspection personnel
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

      <DataTable columns={columns} data={inspectors} />
    </div>
  );
}
