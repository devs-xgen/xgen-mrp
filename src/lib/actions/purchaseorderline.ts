'use server'

import { prisma } from "@/lib/db"

// Function to add a PurchaseOrderLine
export async function addPurchaseOrderLine(data: { poId: any; materialId: any; quantity: any; unitPrice: any; notes: any; createdBy: any; }) {
  try {
    const { poId, materialId, quantity, unitPrice, notes, createdBy } = data;

    const purchaseOrderLine = await prisma.purchaseOrderLine.create({
      data: {
        poId,
        materialId,
        quantity,
        unitPrice,
        notes,
        createdBy,
      },
    });

    return purchaseOrderLine;
  } catch (error) {
    console.error("Error adding PurchaseOrderLine:", error);
    throw new Error("Failed to add PurchaseOrderLine.");
  }
}

// Function to retrieve all PurchaseOrderLines
export async function getPurchaseOrderLines() {
  try {
    const purchaseOrderLines = await prisma.purchaseOrderLine.findMany({
      include: {
        material: true,
        purchaseOrder: true,
      },
    });

    return purchaseOrderLines;
  } catch (error) {
    console.error("Error retrieving PurchaseOrderLines:", error);
    throw new Error("Failed to retrieve PurchaseOrderLines.");
  }
}

// Function to update a PurchaseOrderLine or its material details
export async function updatePurchaseOrderline(id: any, updates: any) {
  try {
    const updatedPurchaseOrderLine = await prisma.purchaseOrderLine.update({
      where: { id },
      data: updates,
    });

    return updatedPurchaseOrderLine;
  } catch (error) {
    console.error("Error updating PurchaseOrderLine:", error);
    throw new Error("Failed to update PurchaseOrderLine.");
  }
}

// Function to delete a Purchase Order Line
export async function deletePurchaseOrderLine(id: string) {
  try {
    await prisma.purchaseOrderLine.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error deleting PurchaseOrderLine:", error);
    throw new Error("Failed to delete PurchaseOrderLine.");
  }
}