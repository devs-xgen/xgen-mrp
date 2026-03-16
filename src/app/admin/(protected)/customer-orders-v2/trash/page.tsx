import { Metadata } from "next";
import { getTrashedCustomerOrders } from "@/lib/actions/customer-order";
import { TrashedCustomerOrdersClient } from "@/components/module/admin/customer-orders/trashed-customer-orders-client";
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
  title: "Trash — Customer Orders",
  description: "View and restore recently deleted customer orders",
};

export default async function TrashedCustomerOrdersPage() {
  const trashed = await getTrashedCustomerOrders();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Trash — Customer Orders</PageTitle>
          <PageDescription>
            Recently deleted customer orders. Records are permanently removed after 30 days.
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody className="space-y-6">
        <SectionCard heading="Recently Deleted Customer Orders">
          <TrashedCustomerOrdersClient data={trashed} />
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
}
