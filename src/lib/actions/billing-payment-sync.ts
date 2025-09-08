"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializeDecimals } from "@/lib/utils/decimal-serializer";

/**
 * Automatically sets billing statement status to PAID when payment is complete
 * This function should be called after recording a payment
 */
export async function syncBillingStatusWithPayment(customerOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Get customer order with all billing statements and transactions
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: customerOrderId },
      include: {
        billingStatements: true,
        transaction: {
          where: { status: "COMPLETED" }
        }
      }
    });

    if (!customerOrder) {
      throw new Error("Customer order not found");
    }

    // Calculate total paid amount
    const totalPaid = customerOrder.transaction.reduce(
      (sum, transaction) => sum + Number(transaction.amount), 0
    );

    const totalOrderAmount = Number(customerOrder.totalAmount);
    const isFullyPaid = totalPaid >= totalOrderAmount;

    if (!isFullyPaid) {
      return {
        success: false,
        message: `Payment not yet complete. ₱${(totalOrderAmount - totalPaid).toLocaleString()} remaining.`,
        remainingBalance: totalOrderAmount - totalPaid,
        totalPaid,
        totalAmount: totalOrderAmount
      };
    }

    // Update all billing statements for this order to PAID
    const updatedStatements = await prisma.$transaction(async (tx) => {
      const statements = await tx.billingStatement.findMany({
        where: { 
          customerOrderId,
          status: { not: "PAID" } // Only update non-paid statements
        }
      });

      const updates = await Promise.all(
        statements.map(statement =>
          tx.billingStatement.update({
            where: { id: statement.id },
            data: {
              status: "PAID",
              paidDate: new Date(),
              modifiedBy: session.user.id,
              modifiedAt: new Date(),
            },
          })
        )
      );

      return updates;
    });

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/billing/billing-statements");

    return {
      success: true,
      message: `${updatedStatements.length} billing statement(s) marked as PAID`,
      updatedCount: updatedStatements.length,
      updatedStatements: serializeDecimals(updatedStatements)
    };
  } catch (error) {
    console.error("Error syncing billing status:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to sync billing status"
    };
  }
}

/**
 * Checks if a customer order has all payments complete and can mark billing as PAID
 */
export async function checkPaymentCompletion(customerOrderId: string) {
  try {
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: customerOrderId },
      include: {
        billingStatements: true,
        transaction: {
          where: { status: "COMPLETED" }
        }
      }
    });

    if (!customerOrder) {
      throw new Error("Customer order not found");
    }

    const totalPaid = customerOrder.transaction.reduce(
      (sum, transaction) => sum + Number(transaction.amount), 0
    );

    const totalOrderAmount = Number(customerOrder.totalAmount);
    const remainingBalance = totalOrderAmount - totalPaid;
    const isFullyPaid = remainingBalance <= 0;

    // Check if any billing statements are not yet PAID
    const unpaidStatements = customerOrder.billingStatements.filter(
      statement => statement.status !== "PAID"
    );

    return {
      isFullyPaid,
      totalPaid,
      totalAmount: totalOrderAmount,
      remainingBalance,
      unpaidStatementsCount: unpaidStatements.length,
      canMarkAsPaid: isFullyPaid && unpaidStatements.length > 0
    };
  } catch (error) {
    console.error("Error checking payment completion:", error);
    throw new Error("Failed to check payment completion");
  }
}

/**
 * Gets payment summary for a customer order
 */
export async function getPaymentSummary(customerOrderId: string) {
  try {
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: customerOrderId },
      include: {
        transaction: {
          where: { status: "COMPLETED" },
          include: {
            handledByUser: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!customerOrder) {
      throw new Error("Customer order not found");
    }

    const totalPaid = customerOrder.transaction.reduce(
      (sum, transaction) => sum + Number(transaction.amount), 0
    );

    return {
      totalAmount: Number(customerOrder.totalAmount),
      totalPaid,
      remainingBalance: Number(customerOrder.totalAmount) - totalPaid,
      transactions: serializeDecimals(customerOrder.transaction),
      transactionCount: customerOrder.transaction.length
    };
  } catch (error) {
    console.error("Error getting payment summary:", error);
    throw new Error("Failed to get payment summary");
  }
}
