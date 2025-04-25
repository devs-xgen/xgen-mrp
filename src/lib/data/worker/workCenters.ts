"use server";

import { prisma } from "@/lib/db";

export async function getWorkCenterById(id: string) {
  if (!id) return null;
  
  try {
    const workCenter = await prisma.workCenter.findUnique({
      where: { id }
    });
    
    return workCenter;
  } catch (error) {
    console.error("Error fetching work center:", error);
    return null;
  }
} 