// pages/admin/work-center/index.tsx (Server Component)
import { Metadata } from "next";
import { WorkCenterDataTable } from "@/components/module/admin/work-centers/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllWorkCenters } from "@/lib/actions/workcenter";
import { revalidatePath } from "next/cache";
import { CreateWorkCenterDialog } from "@/components/module/admin/work-centers/create-center-dialog";

export const metadata: Metadata = {
  title: "Work Centers",
  description: "Manage your work centers",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/work-center");
}

export default async function WorkCentersPage() {
  const workCenters = await getAllWorkCenters();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Work Centers Management
        </h1>
        <div className="flex items-center gap-2">
                  {/* <MaterialTypeDialog
                    materialTypes={materialTypes}
                    onSuccess={refreshData}
                  />
                  <UnitOfMeasureDialog
                    unitOfMeasures={unitOfMeasures}
                    onSuccess={refreshData}
                  /> */}
                  <CreateWorkCenterDialog
                    onSuccess={refreshData} 
                    workCenterTypes={[]}                 
                   />
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Work Centers</CardTitle>
            <CardDescription>
              Manage and monitor your work centers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkCenterDataTable data={workCenters} onSuccess={refreshData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
