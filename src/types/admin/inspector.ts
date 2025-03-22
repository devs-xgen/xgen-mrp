// src/types/admin/inspector.ts

export interface Inspector {
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
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string | null;
    modifiedBy?: string | null;
  }
  
  export interface InspectorColumn {
    inspectorId: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    department?: string | null;
    specialization?: string | null;
    certificationLevel?: string | null;
    yearsOfExperience?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateInspectorInput {
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
  }
  
  export interface UpdateInspectorInput {
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
  }