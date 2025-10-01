"use server";

import { revalidatePath } from "next/cache";

import {
  getAllSalesInvoices as baseGetAllSalesInvoices,
  getSalesInvoiceById as baseGetSalesInvoiceById,
  createSalesInvoice as baseCreateSalesInvoice,
  updateSalesInvoice as baseUpdateSalesInvoice,
  updateSalesInvoiceStatus as baseUpdateSalesInvoiceStatus,
  deleteSalesInvoice as baseDeleteSalesInvoice,
  generateInvoiceFromCustomerOrder as baseGenerateInvoiceFromCustomerOrder,
  generateInvoiceFromProductionOrder as baseGenerateInvoiceFromProductionOrder,
  exportSalesInvoicesExcel as baseExportSalesInvoicesExcel,
} from "@/lib/actions/sales-invoices";
import { ensureSuperAdmin } from "./index";
import type {
  SalesInvoiceFilters,
  PaginatedResponse,
  SalesInvoiceWithItems,
  BillingActionResponse,
  SalesInvoice,
  SalesInvoiceFormData,
  InvoiceStatus,
} from "@/types/admin/billing";

export async function getAllSalesInvoices(
  filters?: SalesInvoiceFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<SalesInvoiceWithItems>> {
  await ensureSuperAdmin();
  return baseGetAllSalesInvoices(filters, page, pageSize);
}

export async function getSalesInvoiceById(
  id: string
): Promise<SalesInvoiceWithItems> {
  await ensureSuperAdmin();
  return baseGetSalesInvoiceById(id);
}

export async function createSalesInvoice(
  data: SalesInvoiceFormData
): Promise<BillingActionResponse<SalesInvoice>> {
  await ensureSuperAdmin();
  const result = await baseCreateSalesInvoice(data);
  if (result?.success && result.data?.id) {
    revalidatePath("/superadmin/billing/sales-invoices");
    revalidatePath(`/superadmin/billing/sales-invoices/${result.data.id}`);
  }
  return result;
}

export async function updateSalesInvoice(
  id: string,
  data: Partial<SalesInvoiceFormData>
): Promise<BillingActionResponse<SalesInvoice>> {
  await ensureSuperAdmin();
  const result = await baseUpdateSalesInvoice(id, data);
  revalidatePath("/superadmin/billing/sales-invoices");
  revalidatePath(`/superadmin/billing/sales-invoices/${id}`);
  return result;
}

export async function updateSalesInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<BillingActionResponse<SalesInvoice>> {
  await ensureSuperAdmin();
  const result = await baseUpdateSalesInvoiceStatus(id, status);
  revalidatePath("/superadmin/billing/sales-invoices");
  revalidatePath(`/superadmin/billing/sales-invoices/${id}`);
  return result;
}

export async function deleteSalesInvoice(
  id: string
): Promise<BillingActionResponse<void>> {
  await ensureSuperAdmin();
  const result = await baseDeleteSalesInvoice(id);
  revalidatePath("/superadmin/billing/sales-invoices");
  return result;
}

export async function generateInvoiceFromCustomerOrder(
  customerOrderId: string
): Promise<BillingActionResponse<SalesInvoice>> {
  await ensureSuperAdmin();
  const result = await baseGenerateInvoiceFromCustomerOrder(customerOrderId);
  if (result?.success) {
    revalidatePath("/superadmin/billing/sales-invoices");
  }
  return result;
}

export async function generateInvoiceFromProductionOrder(
  productionOrderId: string
): Promise<BillingActionResponse<SalesInvoice>> {
  await ensureSuperAdmin();
  const result = await baseGenerateInvoiceFromProductionOrder(productionOrderId);
  if (result?.success) {
    revalidatePath("/superadmin/billing/sales-invoices");
  }
  return result;
}

export async function exportSalesInvoicesExcel(
  filters?: SalesInvoiceFilters
): Promise<{ base64: string; filename: string }> {
  await ensureSuperAdmin();
  return baseExportSalesInvoicesExcel(filters);
}
