export interface UserProfileData {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastLoginAt?: string | Date | null;
  profile?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    department?: string | null;
    position?: string | null;
    employeeId?: string | null;
    dateOfBirth?: string | Date | null;
    gender?: string | null;
    avatar?: string | null;
    bio?: string | null;
  } | null;
  emergencyContact?: {
    id: string;
    name: string;
    relationship: string;
    phoneNumber: string;
    altPhoneNumber?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
  workCenterAssignments?: Array<{
    id: string;
    isPrimary: boolean;
    workCenter: {
      id: string;
      name: string;
      description?: string | null;
    };
  }>;
}

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  dateOfBirth?: Date | null;
  gender?: string;
  bio?: string;
}

export interface EmergencyContactUpdateData {
  name: string;
  relationship: string;
  phoneNumber: string;
  altPhoneNumber?: string;
  email?: string;
  address?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | string[];
  message?: string;
}

export interface PasswordChangeEligibility {
  canChange: boolean;
  message?: string;
  daysRemaining?: number | null;
  lastChanged?: Date | null;
}