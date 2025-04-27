"use server";

import { prisma } from "@/lib/db";

export async function getMaterialById(id: string) {
  if (!id) return null;
  
  try {
    const material = await prisma.material.findUnique({
      where: { id }
    });
    
    return material;
  } catch (error) {
    console.error("Error fetching material:", error);
    return null;
  }
} 