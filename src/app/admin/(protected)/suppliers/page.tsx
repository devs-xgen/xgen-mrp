import { Metadata } from "next";
import { CreateSupplierDialog } from '@/components/module/admin/suppliers/create-supplier-dialog'
import { getAllSuppliers } from "@/lib/actions/suppliers"
import { revalidatePath } from "next/cache"
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout"
import { SuppliersDataTable } from "./suppliers-data-table"

export const metadata: Metadata = {
  title: "Suppliers",
  description: "Manage your suppliers and vendor relationships",
};

// Server action to refresh data
async function refreshData() {
  "use server";
  revalidatePath("/admin/suppliers");
}

export default async function SuppliersPage() {
  const suppliers = await getAllSuppliers();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Suppliers</PageTitle>
          <PageDescription>
            Manage your suppliers and vendor relationships
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CreateSupplierDialog onSuccess={refreshData} />
        </PageHeaderActions>
      </PageHeader>

      <SectionCard heading="All Suppliers">
        <SuppliersDataTable 
          suppliers={suppliers}
          onRefresh={refreshData}
        />
      </SectionCard>
    </PageContainer>
  );
}
