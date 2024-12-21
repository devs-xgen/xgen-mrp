// src/types/admin/user.ts

export interface UserProfile {
    id: string
    userId: string
    firstName: string
    lastName: string
    employeeId: string | null
    department: string | null
    position: string | null
    phoneNumber: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
    postalCode: string | null
    dateOfBirth: Date | null
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null
    avatar: string | null
    bio: string | null
    createdAt: Date
    updatedAt: Date
}

export interface UserData {
    id: string
    email: string
    role: 'ADMIN' | 'MANAGER' | 'OPERATOR'
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    createdAt: Date
    updatedAt: Date
    lastLoginAt: Date | null
    profile: UserProfile | null
}

export interface EmergencyContact {
    id: string
    profileId: string
    name: string
    relationship: string
    phoneNumber: string
    altPhoneNumber: string | null
    email: string | null
    address: string | null
    createdAt: Date
    updatedAt: Date
}