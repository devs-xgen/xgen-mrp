// src/app/admin/(protected)/materials/page.tsx
import { Metadata } from "next";
import {
  getAllMaterials,
  getMaterialTypes,
  getUnitOfMeasures,
  getSuppliers,
} from "@/lib/actions/materials";
import { DataTable } from "@/components/module/admin/materials/data-table";
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
    const materials = await getAllMaterials();
    const materialTypes = await getMaterialTypes();
    const unitOfMeasures = await getUnitOfMeasures();
    const suppliers = await getSuppliers();

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Page Header - Following Sales Invoices Pattern */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Materials Management</h2>
            <p className="text-muted-foreground mt-1">
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Error Page Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-destructive">
              Error Loading Materials
            </h2>
            <p className="text-muted-foreground mt-1">
              Unable to load the materials management page
            </p>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-6">
              There was an error loading the materials management page. Please try again later.
            </p>
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
