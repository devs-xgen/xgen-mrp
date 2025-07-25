"use server";

import { createEnhancedBillingStatement, getBillingStatements, getBillingStatement, updateBillingStatementStatus, deleteBillingStatement } from "./enhanced-billing-statements";
import { BillingStatus } from "@prisma/client";

interface SimpleBillingStatementData {
  customerOrderId: string;
  customerName: string;
  totalAmount: number;
  billingDate: Date;
  dueDate: Date;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  notes?: string;
}

export async function createBillingStatement(data: SimpleBillingStatementData) {
  try {
    // Convert to enhanced billing format
    const enhancedData = {
      type: "customer_order" as const,
      customerOrderId: data.customerOrderId,
      totalAmount: data.totalAmount,
      billingDate: data.billingDate,
      dueDate: data.dueDate,
      status: data.status as BillingStatus,
      notes: data.notes,
    };

    return await createEnhancedBillingStatement(enhancedData);
  } catch (error) {
    console.error("Error creating billing statement:", error);
    throw new Error("Failed to create billing statement");
  }
}

// Re-export enhanced functions for backward compatibility
export { getBillingStatements, getBillingStatement, updateBillingStatementStatus, deleteBillingStatement };