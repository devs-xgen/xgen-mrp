import { Metadata } from "next";
import {
  getQualityChecks,
  getAvailableProductionOrders,
} from "@/lib/actions/quality-checks";
import { columns } from "@/components/module/admin/quality-checks/columns";
import { DataTable } from "@/components/module/admin/quality-checks/data-table";
import { CreateCheckDialog } from "@/components/module/admin/quality-checks/create-check-dialog";
import { QualityMetricsDisplay } from "@/components/module/admin/quality-checks/quality-metrics";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";

export const metadata: Metadata = {
  title: "Quality Control",
  description: "Manage quality control inspections and reports",
};

export default async function QualityChecksPage() {
  // Fetch quality checks and available production orders
  const [checks, productionOrders] = await Promise.all([
    getQualityChecks(),
    getAvailableProductionOrders(),
  ]);

  // Transform data for the table
  const tableData = checks.map((check) => ({
    id: check.id,
    checkDate: check.checkDate,
    productName: check.productionOrder.product.name,
    productSku: check.productionOrder.product.sku,
    status: check.status,
    inspectorName: "Admin", // This would normally come from user data
    defectsFound: check.defectsFound,
    actionTaken: check.actionTaken,
  }));

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Quality Control</PageTitle>
          <PageDescription>
            Manage and track quality inspections for production orders
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CreateCheckDialog productionOrders={productionOrders} />
        </PageHeaderActions>
      </PageHeader>

      {/* Quality metrics section */}
      <QualityMetricsDisplay />

      <SectionCard heading="Quality Checks">
        <DataTable columns={columns} data={tableData} />
      </SectionCard>
    </PageContainer>
  );
}
