// src/app/admin/(protected)/materials/page.tsx

import { Metadata } from "next";
import { MaterialDataTable } from "@/components/module/admin/materials/data-table";
import { CreateMaterialDialog } from "@/components/module/admin/materials/create-material-dialog";
import { MaterialTypeDialog } from "@/components/module/admin/materials/material-type-dialog"
import { UnitOfMeasureDialog } from "@/components/module/admin/materials/unit-of-measure-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { Button } from "@/components/ui/button"
import {
  getAllMaterials,
  getAllMaterialTypes,
  getAllUnitMeasures,
} from "@/lib/actions/materials";

import {
  getAllSuppliers
} from "@/lib/actions/suppliers";

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
      getAllMaterials(),
      getAllMaterialTypes(),
      getAllUnitMeasures(),
      getAllSuppliers(),
    ]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Materials Management
        </h1>
        <div className="flex items-center gap-2">
          <MaterialTypeDialog
            materialTypes={materialTypes}
            onSuccess={refreshData}
          />
          <UnitOfMeasureDialog
            unitOfMeasures={unitOfMeasures}
            onSuccess={refreshData}
          />
          <CreateMaterialDialog
            materialTypes={materialTypes}
            unitOfMeasures={unitOfMeasures}
            suppliers={suppliers}
            onSuccess={refreshData}
          />
        </div>
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
