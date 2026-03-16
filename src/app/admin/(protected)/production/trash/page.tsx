import { Metadata } from "next";
import { getTrashedProductionOrders } from "@/lib/actions/production-order";
import { TrashedProductionOrdersClient } from "@/components/module/admin/production/trashed-production-orders-client";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
  SectionCard,
} from "@/components/shared/page-layout";

export const metadata: Metadata = {
  title: "Trash — Production Orders",
  description: "View and restore recently deleted production orders",
};

export default async function TrashedProductionOrdersPage() {
  const trashed = await getTrashedProductionOrders();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Trash — Production Orders</PageTitle>
          <PageDescription>
            Recently deleted production orders. Records are permanently removed after 30 days.
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody className="space-y-6">
        <SectionCard heading="Recently Deleted Production Orders">
          <TrashedProductionOrdersClient data={trashed} />
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
}
