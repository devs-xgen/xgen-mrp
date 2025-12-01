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
import { Prisma } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

const serializeForClient = (value: any): any => {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (typeof BigInt !== "undefined" && t === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();

  const isPrismaDecimal = (() => {
    try {
      if (value?.constructor?.name === "Decimal") return true;
      const DecimalCtor = (Prisma as any)?.Decimal;
      if (DecimalCtor?.isDecimal && DecimalCtor.isDecimal(value)) return true;
      if (DecimalCtor && value instanceof DecimalCtor) return true;
    } catch {
      // ignore detection errors
    }
    return false;
  })();

  if (isPrismaDecimal) {
    const asString = value.toString();
    const asNumber = Number(asString);
    return Number.isFinite(asNumber) ? asNumber : asString;
  }

  if (Array.isArray(value)) {
    return value.map(serializeForClient);
  }

  if (t === "object") {
    const result: Record<string, any> = {};
    for (const [key, subValue] of Object.entries(value)) {
      result[key] = serializeForClient(subValue);
    }
    return result;
  }

  return undefined;
};

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

  const safeOrder = serializeForClient(order);
  const safeCustomers = serializeForClient(customers);
  const safeProducts = serializeForClient(products);

  return (
    <CustomerOrderEditClient
      order={safeOrder}
      customers={safeCustomers}
      products={safeProducts}
    />
  );
}

export default async function CustomerOrderEditPage({ params }: PageProps) {
  const { id } = await params;

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
