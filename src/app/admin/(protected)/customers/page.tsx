import { Metadata } from "next";
import { getAllCustomers } from "@/lib/actions/customers";
import { convertDecimals } from "@/lib/convertDecimals";
import { revalidatePath } from "next/cache";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import { CreateCustomerDialog } from "@/components/module/admin/customers/create-customer-dialog";
import { CustomersDataTable } from "./customers-data-table";

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage your customers and their information",
};

// Server action to refresh data
async function refreshData() {
  "use server";
  revalidatePath("/admin/customers");
}

export default async function CustomersPage() {
  const customersRaw = await getAllCustomers();
  
  // Convert Decimal fields to numbers for client component compatibility
  const customers = convertDecimals(customersRaw);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customers</PageTitle>
          <PageDescription>
            Manage your customers and their information
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CreateCustomerDialog onSuccess={refreshData} />
        </PageHeaderActions>
      </PageHeader>

      <SectionCard heading="All Customers">
        <CustomersDataTable data={customers} onRefresh={refreshData} />
      </SectionCard>
    </PageContainer>
  );
}
