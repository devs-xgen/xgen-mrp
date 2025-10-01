"use server";

import { revalidatePath } from "next/cache";

import {
  getAllDeliveryReceipts as baseGetAllDeliveryReceipts,
  getDeliveryReceiptById as baseGetDeliveryReceiptById,
  createDeliveryReceipt as baseCreateDeliveryReceipt,
  updateDeliveryReceipt as baseUpdateDeliveryReceipt,
  updateDeliveryReceiptStatus as baseUpdateDeliveryReceiptStatus,
  deleteDeliveryReceipt as baseDeleteDeliveryReceipt,
  confirmDelivery as baseConfirmDelivery,
  markDeliveryFailed as baseMarkDeliveryFailed,
  exportDeliveryReceiptsExcel as baseExportDeliveryReceiptsExcel,
  getDeliveryAnalytics as baseGetDeliveryAnalytics,
  createDeliveryReceiptFromCustomerOrder as baseCreateDeliveryReceiptFromCustomerOrder,
  createDeliveryReceiptFromProductionOrder as baseCreateDeliveryReceiptFromProductionOrder,
} from "@/lib/actions/delivery-receipts";
import { ensureSuperAdmin } from "./index";
import type {
  DeliveryReceiptFilters,
  PaginatedResponse,
  DeliveryReceiptWithBilling,
  BillingActionResponse,
  DeliveryReceipt,
  DeliveryReceiptFormData,
  DeliveryStatus,
  DeliveryAnalytics,
} from "@/types/admin/billing";

export async function getAllDeliveryReceipts(
  filters?: DeliveryReceiptFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<DeliveryReceiptWithBilling>> {
  await ensureSuperAdmin();
  return baseGetAllDeliveryReceipts(filters, page, pageSize);
}

export async function getDeliveryReceiptById(
  id: string
): Promise<DeliveryReceiptWithBilling | null> {
  await ensureSuperAdmin();
  return baseGetDeliveryReceiptById(id);
}

export async function createDeliveryReceipt(
  data: DeliveryReceiptFormData
): Promise<BillingActionResponse<DeliveryReceipt>> {
  await ensureSuperAdmin();
  const result = await baseCreateDeliveryReceipt(data);
  if (result?.success && result.data?.id) {
    revalidatePath("/superadmin/billing/delivery-receipts");
    revalidatePath(`/superadmin/billing/delivery-receipts/${result.data.id}`);
  }
  return result;
}

export async function updateDeliveryReceipt(
  id: string,
  data: Partial<DeliveryReceiptFormData>
): Promise<BillingActionResponse<DeliveryReceipt>> {
  await ensureSuperAdmin();
  const result = await baseUpdateDeliveryReceipt(id, data);
  revalidatePath("/superadmin/billing/delivery-receipts");
  revalidatePath(`/superadmin/billing/delivery-receipts/${id}`);
  return result;
}

export async function updateDeliveryReceiptStatus(
  id: string,
  status: DeliveryStatus
): Promise<BillingActionResponse<DeliveryReceipt>> {
  await ensureSuperAdmin();
  const result = await baseUpdateDeliveryReceiptStatus(id, status);
  revalidatePath("/superadmin/billing/delivery-receipts");
  revalidatePath(`/superadmin/billing/delivery-receipts/${id}`);
  return result;
}

export async function deleteDeliveryReceipt(
  id: string
): Promise<BillingActionResponse<void>> {
  await ensureSuperAdmin();
  const result = await baseDeleteDeliveryReceipt(id);
  revalidatePath("/superadmin/billing/delivery-receipts");
  return result;
}

export async function confirmDelivery(
  id: string,
  signature?: string,
  photoEvidence?: string
): Promise<BillingActionResponse<DeliveryReceipt>> {
  await ensureSuperAdmin();
  const result = await baseConfirmDelivery(id, signature, photoEvidence);
  revalidatePath("/superadmin/billing/delivery-receipts");
  revalidatePath(`/superadmin/billing/delivery-receipts/${id}`);
  return result;
}

export async function markDeliveryFailed(
  id: string,
  reason: string
): Promise<BillingActionResponse<DeliveryReceipt>> {
  await ensureSuperAdmin();
  const result = await baseMarkDeliveryFailed(id, reason);
  revalidatePath("/superadmin/billing/delivery-receipts");
  revalidatePath(`/superadmin/billing/delivery-receipts/${id}`);
  return result;
}

export async function exportDeliveryReceiptsExcel(): Promise<{ base64: string; filename: string }> {
  await ensureSuperAdmin();
  return baseExportDeliveryReceiptsExcel();
}

export async function getDeliveryAnalytics(): Promise<DeliveryAnalytics> {
  await ensureSuperAdmin();
  return baseGetDeliveryAnalytics();
}

export async function createDeliveryReceiptFromCustomerOrder(
  customerOrderId: string,
  deliveryData: Partial<DeliveryReceiptFormData>
): Promise<BillingActionResponse<DeliveryReceipt>> {
  await ensureSuperAdmin();
  const result = await baseCreateDeliveryReceiptFromCustomerOrder(customerOrderId, deliveryData);
  if (result?.success) {
    revalidatePath("/superadmin/billing/delivery-receipts");
  }
  return result;
}

export async function createDeliveryReceiptFromProductionOrder(
  productionOrderId: string,
  deliveryData: Partial<DeliveryReceiptFormData>
): Promise<BillingActionResponse<DeliveryReceipt>> {
  await ensureSuperAdmin();
  const result = await baseCreateDeliveryReceiptFromProductionOrder(productionOrderId, deliveryData);
  if (result?.success) {
    revalidatePath("/superadmin/billing/delivery-receipts");
  }
  return result;
}
