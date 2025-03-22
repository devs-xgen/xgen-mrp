// src/lib/actions/inspector.ts
'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Function to get active inspectors from the database using Prisma client
export async function getActiveInspectors() {
    try {
      // Use the Prisma client to query inspectors
      const inspectors = await prisma.inspector.findMany({
        where: { 
          isActive: true 
        },
        select: {
          inspectorId: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
          specialization: true
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      });
      
      return inspectors;
    } catch (error) {
      console.error('Error fetching active inspectors:', error);
      // Return empty array if there's an error
      return [];
    }
  }

export async function getInspectors() {
  try {
    // For now, return the same mock data
    return await getActiveInspectors();
  } catch (error) {
    console.error('Error fetching inspectors:', error)
    throw new Error('Failed to fetch inspectors')
  }
}

export async function getInspector(id: string) {
  try {
    // Find the inspector in the mock data
    const inspectors = await getActiveInspectors();
    const inspector = inspectors.find(i => i.inspectorId === id);
    
    if (!inspector) {
      throw new Error('Inspector not found')
    }
    
    return inspector;
  } catch (error) {
    console.error('Error fetching inspector:', error)
    throw error
  }
}

export async function createInspector(data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  specialization?: string;
  certificationLevel?: string;
  yearsOfExperience?: number;
  isActive?: boolean;
  notes?: string;
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Mock creation - since we can't actually create an inspector yet
    // In a real application, you would use Prisma to create it
    
    // Return a mock response
    return {
      inspectorId: `inspector-new-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber || null,
      department: data.department || null,
      specialization: data.specialization || null,
      certificationLevel: data.certificationLevel || null,
      yearsOfExperience: data.yearsOfExperience || null,
      isActive: data.isActive ?? true,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session.user.id,
      modifiedBy: null
    };

  } catch (error) {
    console.error('Error creating inspector:', error)
    throw error
  }
}

export async function updateInspector(data: {
  inspectorId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string | null;
  department?: string | null;
  specialization?: string | null;
  certificationLevel?: string | null;
  yearsOfExperience?: number | null;
  isActive?: boolean;
  notes?: string | null;
}) {
  // Mock update function
  return {
    ...data,
    updatedAt: new Date()
  };
}

export async function deleteInspector(id: string) {
  // Mock delete function
  console.log(`Would delete inspector with ID: ${id}`);
  return true;
}