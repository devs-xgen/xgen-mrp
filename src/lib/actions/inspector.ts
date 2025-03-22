// src/lib/actions/inspectors.ts
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
    // Get all inspectors without relations until the schema is properly set up
    const inspectors = await prisma.inspector.findMany({
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
    
    return inspectors;
  } catch (error) {
    console.error('Error fetching inspectors:', error)
    throw new Error('Failed to fetch inspectors')
  }
}

export async function getInspector(id: string) {
  try {
    const inspector = await prisma.inspector.findUnique({
      where: { inspectorId: id },
    });
    
    if (!inspector) {
      throw new Error('Inspector not found')
    }
    
    return inspector;
  } catch (error) {
    console.error('Error fetching inspector:', error)
    throw error
  }
}

export async function getInspectorTypes() {
  try {
    const inspectorTypes = await prisma.inspectorType.findMany({
      orderBy: { name: 'asc' }
    });
    
    return inspectorTypes;
  } catch (error) {
    console.error('Error fetching inspector types:', error)
    return [];
  }
}

export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    
    return departments;
  } catch (error) {
    console.error('Error fetching departments:', error)
    return [];
  }
}

export async function getQualifications() {
  try {
    const qualifications = await prisma.qualification.findMany({
      orderBy: { name: 'asc' }
    });
    
    return qualifications;
  } catch (error) {
    console.error('Error fetching qualifications:', error)
    return [];
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
    
    const inspector = await prisma.inspector.create({
      data: {
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
        createdBy: session.user.id
      }
    });
    
    revalidatePath('/admin/inspectors');
    return inspector;
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
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    const { inspectorId, ...updateData } = data;
    
    // Update the inspector data
    const inspector = await prisma.inspector.update({
      where: { inspectorId },
      data: {
        ...updateData,
        modifiedBy: session.user.id,
        updatedAt: new Date()
      }
    });
    
    revalidatePath('/admin/inspectors');
    return inspector;
  } catch (error) {
    console.error('Error updating inspector:', error)
    throw error
  }
}

export async function deleteInspector(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    // Soft delete by setting isActive to false instead of actually deleting
    await prisma.inspector.update({
      where: { inspectorId: id },
      data: { 
        isActive: false,
        modifiedBy: session.user.id,
        updatedAt: new Date()
      }
    });
    
    revalidatePath('/admin/inspectors');
    return true;
  } catch (error) {
    console.error('Error deleting inspector:', error)
    throw error
  }
}

export async function createInspectorType(data: { name: string; description?: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    const inspectorType = await prisma.inspectorType.create({
      data: {
        name: data.name,
        description: data.description || null,
        createdBy: session.user.id
      }
    });
    
    revalidatePath('/admin/inspectors');
    return inspectorType;
  } catch (error) {
    console.error('Error creating inspector type:', error)
    throw error
  }
}

export async function createDepartment(data: { name: string; description?: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    const department = await prisma.department.create({
      data: {
        name: data.name,
        description: data.description || null,
        createdBy: session.user.id
      }
    });
    
    revalidatePath('/admin/inspectors');
    return department;
  } catch (error) {
    console.error('Error creating department:', error)
    throw error
  }
}

export async function updateInspectorType(data: { 
  inspectorTypeId: string; 
  name?: string; 
  description?: string | null 
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    const inspectorType = await prisma.inspectorType.update({
      where: { inspectorTypeId: data.inspectorTypeId },
      data: {
        name: data.name,
        description: data.description,
        modifiedBy: session.user.id,
        updatedAt: new Date()
      }
    });
    
    revalidatePath('/admin/inspectors');
    return inspectorType;
  } catch (error) {
    console.error('Error updating inspector type:', error)
    throw error
  }
}

export async function updateDepartment(data: { 
  departmentId: string; 
  name?: string; 
  description?: string | null 
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    const department = await prisma.department.update({
      where: { departmentId: data.departmentId },
      data: {
        name: data.name,
        description: data.description,
        modifiedBy: session.user.id,
        updatedAt: new Date()
      }
    });
    
    revalidatePath('/admin/inspectors');
    return department;
  } catch (error) {
    console.error('Error updating department:', error)
    throw error
  }
}

export async function deleteInspectorType(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    await prisma.inspectorType.delete({
      where: { inspectorTypeId: id }
    });
    
    revalidatePath('/admin/inspectors');
    return true;
  } catch (error) {
    console.error('Error deleting inspector type:', error)
    throw error
  }
}

export async function deleteDepartment(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    await prisma.department.delete({
      where: { departmentId: id }
    });
    
    revalidatePath('/admin/inspectors');
    return true;
  } catch (error) {
    console.error('Error deleting department:', error)
    throw error
  }
}