"use server";

import { revalidatePath } from "next/cache";

import {
  getAllBillingStatements as baseGetAllBillingStatements,
  deleteBillingStatement as baseDeleteBillingStatement,
  exportBillingStatementsData as baseExportBillingStatementsData,
  exportBillingStatementsExcel as baseExportBillingStatementsExcel,
  createBillingStatement as baseCreateBillingStatement,
  getBillingStatementById as baseGetBillingStatementById,
  updateBillingStatement as baseUpdateBillingStatement,
  updateBillingStatementStatus as baseUpdateBillingStatementStatus,
} from "@/lib/actions/billing-statements";
import { ensureSuperAdmin } from "./index";
import type {
  BillingStatementFilters,
  PaginatedResponse,
  BillingStatementWithRelations,
  BillingActionResponse,
  CSVExportResponse,
  BillingStatement,
  BillingStatementFormData,
  BillingStatus,
} from "@/types/admin/billing";
import type { SerializableData } from "@/lib/utils/decimal-serializer";

export async function getAllBillingStatements(
  filters?: BillingStatementFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<SerializableData<BillingStatementWithRelations>>> {
  await ensureSuperAdmin();
  return baseGetAllBillingStatements(filters, page, pageSize);
}

export async function deleteBillingStatement(id: string): Promise<BillingActionResponse> {
  await ensureSuperAdmin();
  const result = await baseDeleteBillingStatement(id);
  revalidatePath("/superadmin/billing/billing-statements");
  revalidatePath(`/superadmin/billing/billing-statements/${id}`);
  return result;
}

export async function exportBillingStatementsData(
  filters?: BillingStatementFilters
): Promise<CSVExportResponse | null> {
  await ensureSuperAdmin();
  return baseExportBillingStatementsData(filters);
}

export async function exportBillingStatementsExcel(
  filters?: BillingStatementFilters
): Promise<{ base64: string; filename: string } | null> {
  await ensureSuperAdmin();
  return baseExportBillingStatementsExcel(filters);
}

export async function createBillingStatement(
  data: BillingStatementFormData
): Promise<BillingActionResponse<SerializableData<BillingStatement>>> {
  await ensureSuperAdmin();
  const result = await baseCreateBillingStatement(data);
  if (result?.success && result.data?.id) {
    revalidatePath("/superadmin/billing/billing-statements");
    revalidatePath(`/superadmin/billing/billing-statements/${result.data.id}`);
  }
  return result;
}

export async function getBillingStatementById(
  id: string
): Promise<SerializableData<BillingStatementWithRelations> | null> {
  await ensureSuperAdmin();
  return baseGetBillingStatementById(id);
}

export async function updateBillingStatement(
  id: string,
  data: BillingStatementFormData
): Promise<BillingActionResponse> {
  await ensureSuperAdmin();
  const result = await baseUpdateBillingStatement(id, data);
  revalidatePath("/superadmin/billing/billing-statements");
  revalidatePath(`/superadmin/billing/billing-statements/${id}`);
  return result;
}

export async function updateBillingStatementStatus(
  id: string,
  status: BillingStatus
): Promise<BillingActionResponse> {
  await ensureSuperAdmin();
  const result = await baseUpdateBillingStatementStatus(id, status);
  revalidatePath("/superadmin/billing/billing-statements");
  revalidatePath(`/superadmin/billing/billing-statements/${id}`);
  return result;
}
