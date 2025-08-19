import { Metadata } from "next";
import { ProductionCreateClient } from "@/components/module/admin/production/create/ProductionCreateClient";
import { getProductsWithVariantsForOrders } from "@/lib/actions/product";
import { getAllCustomers } from "@/lib/actions/customers";
import { getCustomerOrders } from "@/lib/actions/customer-order";

export const metadata: Metadata = {
  title: "Create Production Order",
  description:
    "Create a new production order with optional customer order linkage",
};

interface CreateProductionPageProps {
  searchParams: Promise<{
    productId?: string;
    variantId?: string;
    customerOrderId?: string;
    quantity?: string;
    batch?: string; // New batch mode parameter
  }>;
}

export default async function CreateProductionPage({
  searchParams,
}: CreateProductionPageProps) {
  const params = await searchParams;

  // Fetch required data for the form
  const [products, customers, customerOrders] = await Promise.all([
    getProductsWithVariantsForOrders(),
    getAllCustomers(),
    getCustomerOrders(),
  ]);

  // Pre-fill data from query params
  const prefillData = {
    productId: params.productId || "",
    productVariantId: params.variantId || "",
    customerOrderId: params.customerOrderId || "",
    quantity: params.quantity ? parseInt(params.quantity, 10) : 1,
  };

  // Parse batch data if provided
  let batchMode = false;
  let batchItems: any[] = [];
  
  if (params.batch) {
    try {
      const batchData = JSON.parse(decodeURIComponent(params.batch));
      batchMode = batchData.batchMode || false;
      batchItems = batchData.batchItems || [];
    } catch (error) {
      console.error("Failed to parse batch data:", error);
    }
  }

  return (
    <ProductionCreateClient
      products={products}
      customers={customers}
      customerOrders={customerOrders}
      prefillData={prefillData}
      batchMode={batchMode}
      batchItems={batchItems}
    />
  );
}
