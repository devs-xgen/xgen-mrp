import { Suspense } from "react";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
} from "@/components/shared/page-layout";
import { CustomerOrderV2Client } from "@/components/module/admin/customer-order-ver/CustomerOrderV2Client";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { getAllCustomers } from "@/lib/actions/customers";
import { getAllProducts } from "@/lib/actions/product";
import { CustomerOrderV2TableLoadingState } from "@/components/module/admin/customer-order-ver/CustomerOrderV2LoadingState";

async function CustomerOrderV2PageContent() {
  // Fetch initial data for the page
  const [orders, customers, products] = await Promise.all([
    getCustomerOrders(),
    getAllCustomers(),
    getAllProducts(),
  ]);

  return (
    <CustomerOrderV2Client
      initialOrders={orders}
      customers={customers}
      products={products}
    />
  );
}

export default async function CustomerOrderV2Page() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customer Orders V2</PageTitle>
          <PageDescription>
            Enhanced customer order management with advanced features, real-time fulfillment tracking, and integrated production planning
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        <Suspense fallback={<CustomerOrderV2TableLoadingState />}>
          <CustomerOrderV2PageContent />
        </Suspense>
      </PageBody>
    </PageContainer>
  );
}
