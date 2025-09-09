"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { serializeDecimals } from "@/lib/utils/decimal-serializer";
import { Status, PaymentMethod } from "@prisma/client";
import { checkPaymentCompletion, syncBillingStatusWithPayment } from "@/lib/actions/billing-payment-sync";

export type CreateTransactionInput = {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  notes?: string;
  status?: Status; // default COMPLETED
};

export async function createTransactionForOrder(input: CreateTransactionInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const tx = await prisma.transaction.create({
      data: {
        orderId: input.orderId,
        paymentMethod: input.paymentMethod,
        amount: new Decimal(input.amount),
        handledBy: session.user.id,
        paymentDate: input.paymentDate,
        status: input.status ?? Status.COMPLETED,
        notes: input.notes,
      },
      include: {
        handledByUser: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        customerOrder: { select: { id: true, orderNumber: true } },
      },
    });

    // After recording the payment, auto-sync billing status if the order is fully paid
    try {
      const completion = await checkPaymentCompletion(input.orderId);
      if (completion.isFullyPaid) {
        await syncBillingStatusWithPayment(input.orderId);
      }
    } catch (autoSyncErr) {
      console.error("Auto-sync billing status failed:", autoSyncErr);
      // Do not fail the payment creation if auto-sync fails; user can trigger manually from UI
    }

    // Revalidate key pages that show customer orders and payments
    revalidatePath("/admin/customer-orders");
    revalidatePath("/admin/customer-orders-v2");

    return serializeDecimals(tx);
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw new Error("Failed to create transaction");
  }
}
