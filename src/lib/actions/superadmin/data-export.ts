"use server";

import { prisma } from "@/lib/db";
import { ensureSuperAdmin } from "./index";

type RawTableInfo = {
  table_name: string;
  row_estimate: number | null;
};

type RawColumnInfo = {
  column_name: string;
};

export type DatabaseTableInfo = {
  name: string;
  rowEstimate: number;
};

const TABLE_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

export async function getDatabaseTables(): Promise<DatabaseTableInfo[]> {
  await ensureSuperAdmin();

  const rawResults = await prisma.$queryRaw`
    SELECT relname AS table_name, n_live_tup AS row_estimate
    FROM pg_catalog.pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY relname
  `;

  const results = (rawResults as RawTableInfo[] | null | undefined) ?? [];

  return results.map((row) => ({
    name: row.table_name,
    rowEstimate: Number(row.row_estimate ?? 0),
  }));
}

function validateTableName(tableName: string) {
  if (!tableName || !TABLE_NAME_REGEX.test(tableName)) {
    throw new Error("Invalid table name");
  }
}

function formatSheetName(name: string) {
  const trimmed = name.trim().slice(0, 31);
  return trimmed.length > 0 ? trimmed : "Export";
}

function serializeCellValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }
  return value;
}

export async function exportTableToExcel(
  tableName: string
): Promise<{ base64: string; filename: string }> {
  await ensureSuperAdmin();

  const sanitized = tableName.trim();
  validateTableName(sanitized);

  const availableTables = await getDatabaseTables();
  const isAllowed = availableTables.some((table) => table.name === sanitized);
  if (!isAllowed) {
    throw new Error("Table not found or not accessible");
  }

  const rawColumns = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${sanitized}
    ORDER BY ordinal_position
  `;

  const columns = (rawColumns as RawColumnInfo[] | null | undefined) ?? [];

  if (!columns.length) {
    throw new Error("No columns found for this table");
  }

  const columnNames = columns.map((column) => column.column_name);
  const quotedTable = `"${sanitized}"`;
  const query = `SELECT * FROM ${quotedTable}`;
  const rawRows = await prisma.$queryRawUnsafe(query);
  const rows = (rawRows as Record<string, unknown>[] | null | undefined) ?? [];

  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(formatSheetName(sanitized));

  worksheet.addRow(columnNames);
  worksheet.getRow(1).font = { bold: true };

  rows.forEach((row) => {
    const rowData = columnNames.map((column) => serializeCellValue(row[column]));
    worksheet.addRow(rowData);
  });

  worksheet.columns?.forEach((column) => {
    if (!column) return;
    let max = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value;
      const length = value ? String(value).length : 0;
      if (length > max) max = length;
    });
    column.width = Math.min(60, max + 2);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${sanitized}-${timestamp}.xlsx`;

  return { base64, filename };
}
