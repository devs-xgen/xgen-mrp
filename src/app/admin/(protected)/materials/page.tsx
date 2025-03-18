// // src/app/admin/(protected)/materials/page.tsx
// import { Metadata } from "next";
// import {
//   getMaterials,
//   getMaterialTypes,
//   getUnitOfMeasures,
//   getSuppliers,
// } from "@/lib/actions/materials";
// import { DataTable } from "@/components/module/admin/materials/data-table";
// import { columns } from "@/components/module/admin/materials/columns";
// import { Button } from "@/components/ui/button";
// import { CreateMaterialDialog } from "@/components/module/admin/materials/create-material-dialog";
// import { MaterialTypeDialog } from "@/components/module/admin/materials/material-type-dialog";
// import { UnitOfMeasureDialog } from "@/components/module/admin/materials/unit-of-measure-dialog";

// export const metadata: Metadata = {
//   title: "Materials Management",
//   description: "Manage and monitor your material inventory",
// };

// async function revalidateData() {
//   "use server";
//   try {
//     const materialTypes = await getMaterialTypes();
//     const unitOfMeasures = await getUnitOfMeasures();
//     return { materialTypes, unitOfMeasures };
//   } catch (error) {
//     console.error("Error revalidating data:", error);
//     throw new Error("Failed to refresh data");
//   }
// }

// export default async function MaterialsPage() {
//   const materials = await getMaterials();
//   const materialTypes = await getMaterialTypes();
//   const unitOfMeasures = await getUnitOfMeasures();
//   const suppliers = await getSuppliers();

//   return (
//     <div className="flex flex-col gap-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">
//             Materials Management
//           </h1>
//           <p className="text-muted-foreground">
//             Manage and monitor your material inventory
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <MaterialTypeDialog
//             materialTypes={materialTypes}
//             onSuccess={revalidateData}
//           />
//           <UnitOfMeasureDialog
//             unitOfMeasures={unitOfMeasures}
//             onSuccess={revalidateData}
//           />
//           <CreateMaterialDialog
//             materialTypes={materialTypes}
//             unitOfMeasures={unitOfMeasures}
//             suppliers={suppliers}
//           />
//         </div>
//       </div>
//       <DataTable columns={columns} data={materials} />
//     </div>
//   );
// }

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

export const metadata: Metadata = {
  title: "Materials Management",
  description: "Manage and monitor your material inventory",
};

async function revalidateData() {
  "use server";
  try {
    revalidatePath('/admin/materials');
    const materialTypes = await getMaterialTypes();
    const unitOfMeasures = await getUnitOfMeasures();
    return { materialTypes, unitOfMeasures };
  } catch (error) {
    console.error("Error revalidating data:", error);
    throw new Error("Failed to refresh data");
  }
}

export default async function MaterialsPage() {
  // Use regular getMaterials instead of the enhanced function
  const materials = await getMaterials();
  const materialTypes = await getMaterialTypes();
  const unitOfMeasures = await getUnitOfMeasures();
  const suppliers = await getSuppliers();

  // Function to refresh data on the server side
  async function refreshData() {
    'use server'
    revalidatePath('/admin/materials');
  }

  return (
    <div className="flex flex-col gap-6">
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

      {/* Dashboard Component */}
      <MaterialsDashboard 
        materials={materials}
        materialTypes={materialTypes}
        unitOfMeasures={unitOfMeasures}
        suppliers={suppliers}
      />
      
      <DataTable
        columns={columns}
        data={materials}
        materialTypes={materialTypes}
        unitOfMeasures={unitOfMeasures}
        suppliers={suppliers}
      />
    </div>
  );
}