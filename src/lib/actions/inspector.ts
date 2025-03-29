'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export type Inspector = {
  inspectorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  department?: string | null;
  specialization?: string | null;
  certificationLevel?: string | null;
  yearsOfExperience?: number | null;
  isActive: boolean;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export type InspectorFormData = Omit<Inspector, 'inspectorId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'modifiedBy'>;

export async function getInspectors() {
  try {
    const inspectors = await prisma.inspector.findMany({
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
    
    return inspectors;
  } catch (error) {
    console.error('Error fetching inspectors:', error);
    throw new Error('Failed to fetch inspectors');
  }
}

export async function getActiveInspectors() {
  try {
    const inspectors = await prisma.inspector.findMany({
      where: { 
        isActive: true 
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
    
    return inspectors;
  } catch (error) {
    console.error('Error fetching active inspectors:', error);
    return [];
  }
}

export async function getInspector(id: string) {
  try {
    const inspector = await prisma.inspector.findUnique({
      where: { inspectorId: id },
    });
    
    if (!inspector) {
      throw new Error('Inspector not found');
    }
    
    return inspector;
  } catch (error) {
    console.error('Error fetching inspector:', error);
    throw error;
  }
}

export async function getDepartments() {
  try {
    // Get distinct department values
    const departmentsResult = await prisma.inspector.findMany({
      select: {
        department: true,
      },
      where: {
        department: {
          not: null,
        },
      },
      distinct: ['department'],
    });
    
    // Transform the result to a simple array of departments
    const departments = departmentsResult
      .filter(item => item.department !== null)
      .map(item => item.department as string);
    
    return departments.sort();
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

export async function getSpecializations() {
  try {
    // Get distinct specialization values
    const specializationsResult = await prisma.inspector.findMany({
      select: {
        specialization: true,
      },
      where: {
        specialization: {
          not: null,
        },
      },
      distinct: ['specialization'],
    });
    
    // Transform the result to a simple array
    const specializations = specializationsResult
      .filter(item => item.specialization !== null)
      .map(item => item.specialization as string);
    
    return specializations.sort();
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return [];
  }
}

export async function createInspector(data: InspectorFormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error('Unauthorized');
    
    const inspector = await prisma.inspector.create({
      data: {
        ...data,
        createdBy: session.user.id,
      }
    });
    
    revalidatePath('/admin/inspectors');
    return inspector;
  } catch (error) {
    console.error('Error creating inspector:', error);
    throw error;
  }
}

export async function updateInspector(inspectorId: string, data: Partial<InspectorFormData>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error('Unauthorized');
    
    const inspector = await prisma.inspector.update({
      where: { inspectorId },
      data: {
        ...data,
        modifiedBy: session.user.id,
      }
    });
    
    revalidatePath('/admin/inspectors');
    return inspector;
  } catch (error) {
    console.error('Error updating inspector:', error);
    throw error;
  }
}

export async function deleteInspector(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error('Unauthorized');
    
    await prisma.inspector.delete({
      where: { inspectorId: id }
    });
    
    revalidatePath('/admin/inspectors');
    return true;
  } catch (error) {
    console.error('Error deleting inspector:', error);
    throw error;
  }
}

export async function toggleInspectorStatus(id: string, isActive: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error('Unauthorized');
    
    const inspector = await prisma.inspector.update({
      where: { inspectorId: id },
      data: { 
        isActive,
        modifiedBy: session.user.id,
      }
    });
    
    revalidatePath('/admin/inspectors');
    return inspector;
  } catch (error) {
    console.error(`Error ${isActive ? 'activating' : 'deactivating'} inspector:`, error);
    throw error;
  }
}