"use server";

import { prisma } from "@/lib/db";

export async function getUserById(id: string) {
  if (!id) return null;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
} 