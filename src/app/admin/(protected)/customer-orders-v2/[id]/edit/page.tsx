import { Suspense } from "react";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
} from "@/components/shared/page-layout";
import { getCustomerOrderById } from "@/lib/actions/customer-order";
import { getAllCustomers } from "@/lib/actions/customers";
import { getAllProducts } from "@/lib/actions/product";
import { CustomerOrderEditClient } from "@/components/module/admin/customer-order-ver/CustomerOrderEditClient";

interface PageProps {
  params: { id: string };
}

async function EditOrderData({ id }: { id: string }) {
  // Fetch all required data
  const [order, customers, products] = await Promise.all([
    getCustomerOrderById(id),
    getAllCustomers(),
    getAllProducts(),
  ]);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  return (
    <CustomerOrderEditClient 
      order={order}
      customers={customers}
      products={products}
    />
  );
}

export default async function CustomerOrderEditPage({ params }: PageProps) {
  const { id } = params;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Edit Customer Order</PageTitle>
          <PageDescription>
            Modify the details and items for this customer order
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        <Suspense fallback={<div>Loading...</div>}>
          <EditOrderData id={id} />
        </Suspense>
      </PageBody>
    </PageContainer>
  );
}
