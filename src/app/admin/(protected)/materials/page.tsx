// src/app/admin/(protected)/materials/page.tsx

import { Metadata } from "next";
import { MaterialDataTable } from "@/components/module/admin/materials/data-table";
import { CreateMaterialDialog } from "@/components/module/admin/materials/create-material-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getMaterials,
  getMaterialTypes,
  getUnitOfMeasures,
  getSuppliers,
} from "@/lib/actions/materials";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Materials Management",
  description: "Manage your material inventory",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/materials");
}

export default async function MaterialsPage() {
  // Fetch all required data in parallel
  const [materials, materialTypes, unitOfMeasures, suppliers] =
    await Promise.all([
      getMaterials(),
      getMaterialTypes(),
      getUnitOfMeasures(),
      getSuppliers(),
    ]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Materials Management
        </h1>
        <CreateMaterialDialog
          materialTypes={materialTypes}
          unitOfMeasures={unitOfMeasures}
          suppliers={suppliers}
          onSuccess={refreshData}
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Materials</CardTitle>
            <CardDescription>
              Manage and monitor your material inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaterialDataTable
              data={materials}
              materialTypes={materialTypes}
              unitOfMeasures={unitOfMeasures}
              suppliers={suppliers}
              onSuccess={refreshData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
