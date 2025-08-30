// src/app/admin/(protected)/materials/page.tsx
import { Metadata } from "next";
import {
  getAllMaterials,
  getMaterialTypes,
  getUnitOfMeasures,
  getSuppliers,
} from "@/lib/actions/materials";
import { CreateMaterialDialog } from "@/components/module/admin/materials/create-material-dialog";
import { MaterialTypeDialog } from "@/components/module/admin/materials/material-type-dialog";
import { UnitOfMeasureDialog } from "@/components/module/admin/materials/unit-of-measure-dialog";
import { revalidatePath } from "next/cache";
import MaterialsDashboard from "@/components/module/admin/materials/materialDashboard";
import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import { MaterialsDataTable } from "./materials-data-table";

export const metadata: Metadata = {
  title: "Materials",
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
  try {
    const materials = await getAllMaterials();
    const materialTypes = await getMaterialTypes();
    const unitOfMeasures = await getUnitOfMeasures();
    const suppliers = await getSuppliers();

    return (
      <PageContainer>
        {/* Page Header - Consistent with Production page */}
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>Materials</PageTitle>
            <PageDescription>
              Manage and monitor your material inventory
            </PageDescription>
          </PageHeaderMain>
          <PageHeaderActions>
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
          </PageHeaderActions>
        </PageHeader>

        {/* Materials Statistics - Direct layout like Production page */}
        <MaterialsDashboard
          materials={materials}
          materialTypes={materialTypes}
          unitOfMeasures={unitOfMeasures}
          suppliers={suppliers}
        />

        {/* Data Table */}
        <SectionCard heading="All Materials">
          <MaterialsDataTable
            materials={materials}
            materialTypes={materialTypes}
            unitOfMeasures={unitOfMeasures}
            suppliers={suppliers}
            onRefresh={refreshData}
          />
        </SectionCard>
      </PageContainer>
    );
  } catch (error) {
    console.error("Error loading materials page:", error);
    return (
      <PageContainer>
        <PageHeader>
          <PageHeaderMain>
            <PageTitle className="text-destructive">Error Loading Materials</PageTitle>
            <PageDescription>
              Unable to load the materials management page
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

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
            <Button asChild>
              <a href="/admin/materials">Try Again</a>
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }
}
