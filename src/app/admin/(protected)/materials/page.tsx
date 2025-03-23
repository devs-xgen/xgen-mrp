// src/app/admin/(protected)/materials/page.tsx
import { Metadata } from "next";
import {
  getMaterials,
  getMaterialTypes,
  getUnitOfMeasures,
  getSuppliers,
} from "@/lib/actions/materials";
import { DataTable } from "@/components/module/admin/materials/data-table";
import { columns } from "@/components/module/admin/materials/columns";
import { CreateMaterialDialog } from "@/components/module/admin/materials/create-material-dialog";
import { MaterialTypeDialog } from "@/components/module/admin/materials/material-type-dialog";
import { UnitOfMeasureDialog } from "@/components/module/admin/materials/unit-of-measure-dialog";
import { revalidatePath } from "next/cache";
import MaterialsDashboard from "@/components/module/admin/materials/materialDashboard";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Materials Management",
  description: "Manage and monitor your material inventory",
};

// Server action to refresh the data - returns void to match the expected type
async function revalidateData() {
  "use server";
  try {
    revalidatePath("/admin/materials");
    // Simply fetch the data to update the cache, but don't return it
    await getMaterialTypes();
    await getUnitOfMeasures();
  } catch (error) {
    console.error("Error revalidating data:", error);
    throw new Error("Failed to refresh data");
  }
}

// Server action to refresh data for the page
async function refreshData() {
  "use server";
  revalidatePath("/admin/materials");
}

export default async function MaterialsPage() {
  // Fetch required data for materials management
  try {
    // Load data with error handling for each resource
    const materials = await getMaterials();
    const materialTypes = await getMaterialTypes();
    const unitOfMeasures = await getUnitOfMeasures();
    const suppliers = await getSuppliers();

    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Materials Management
            </h1>
            <p className="text-muted-foreground">
              Manage and monitor your material inventory
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MaterialTypeDialog
              materialTypes={materialTypes}
              onSuccess={revalidateData}
            />
            <UnitOfMeasureDialog
              unitOfMeasures={unitOfMeasures}
              onSuccess={revalidateData}
            />
            <CreateMaterialDialog
              materialTypes={materialTypes}
              unitOfMeasures={unitOfMeasures}
              suppliers={suppliers}
              onSuccess={refreshData}
            />
          </div>
        </div>

        {/* Dashboard Component with stock statistics */}
        <MaterialsDashboard
          materials={materials}
          materialTypes={materialTypes}
          unitOfMeasures={unitOfMeasures}
          suppliers={suppliers}
        />

        {/* Data Table with materials and editing capabilities */}
        <DataTable
          columns={columns}
          data={materials}
          materialTypes={materialTypes}
          unitOfMeasures={unitOfMeasures}
          suppliers={suppliers}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading materials page:", error);
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Error Loading Materials
        </h1>
        <p className="text-gray-600">
          There was an error loading the materials management page. Please try
          again later.
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            window.location.reload();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }
}
