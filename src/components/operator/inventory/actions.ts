"use server"

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for inventory adjustment
const inventoryAdjustmentSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  quantity: z.coerce.number(),
  reason: z.string().min(1, "Reason is required"),
  type: z.enum(["add", "remove"]),
});

export async function adjustInventory(formData: FormData) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Parse and validate form data
    const data = {
      itemId: formData.get('itemId') as string,
      quantity: Number(formData.get('quantity')),
      reason: formData.get('reason') as string,
      type: formData.get('type') as "add" | "remove",
    };

    const validation = inventoryAdjustmentSchema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        errors: validation.error.flatten().fieldErrors 
      };
    }

    // In a real implementation, this would update the database
    // For now, we'll just simulate success
    
    // Example of how the database update would look:
    /*
    await prisma.$transaction(async (tx) => {
      // Get current item
      const item = await tx.material.findUnique({
        where: { id: data.itemId },
      });
      
      if (!item) {
        throw new Error("Item not found");
      }
      
      // Calculate new quantity
      const newQuantity = data.type === "add" 
        ? item.currentStock + data.quantity
        : item.currentStock - data.quantity;
        
      if (newQuantity < 0) {
        throw new Error("Cannot reduce below zero");
      }
      
      // Update item quantity
      await tx.material.update({
        where: { id: data.itemId },
        data: { currentStock: newQuantity }
      });
      
      // Log the adjustment
      await tx.inventoryAdjustment.create({
        data: {
          materialId: data.itemId,
          quantity: data.quantity,
          type: data.type,
          reason: data.reason,
          adjustedBy: session.user.id,
        }
      });
    });
    */
    
    // Revalidate the inventory page to show updated data
    revalidatePath('/worker/inventory');
    
    return { 
      success: true, 
      message: `Inventory ${data.type === "add" ? "increased" : "decreased"} by ${data.quantity} units` 
    };
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
}

export async function requestInventoryCount(formData: FormData) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const locationId = formData.get('locationId') as string;
    const scheduledDate = formData.get('scheduledDate') as string;
    
    if (!locationId || !scheduledDate) {
      return { success: false, error: "Missing required fields" };
    }

    // In a real implementation, this would create an inventory count request
    // For now, we'll just simulate success
    
    // Revalidate the inventory page
    revalidatePath('/worker/inventory');
    
    return { 
      success: true, 
      message: `Inventory count scheduled for ${scheduledDate}` 
    };
  } catch (error) {
    console.error('Error scheduling inventory count:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
} 