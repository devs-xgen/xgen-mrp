"use server";

import { prisma } from "@/lib/db";

export async function getLocationById(id: string) {
  if (!id) return null;
  
  try {
    const location = await prisma.location.findUnique({
      where: { id }
    });
    
    return location;
  } catch (error) {
    console.error("Error fetching location:", error);
    return null;
  }
} 