import { z } from "zod";

// Schema for profile update validation
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

// Schema for password change validation
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Type for profile update data
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// Type for password change data
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

// Type for emergency contact data
export interface EmergencyContactData {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  altPhoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
}

// Type for work center data
export interface WorkCenterData {
  id: string;
  name: string;
  description?: string | null;
  capacityPerHour?: number;
  operatingHours?: number;
  efficiencyRate?: number; // Changed from number | string to number
}

// Type for operation data
export interface OperationData {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  notes?: string | null;
  cost: number; // Changed from number | string to number
  workCenter: WorkCenterData;
  productionOrder: {
    id: string;
    quantity: number;
    status: string;
    priority: string;
    plannedMaterialCost?: number; // Added for consistency
    actualMaterialCost?: number; // Added for consistency
    materialVariance?: number; // Added for consistency
    product: {
      id: string;
      name: string;
      sku: string;
      unitCost?: number; // Added for consistency
      sellingPrice?: number; // Added for consistency
    };
  };
}

// Type for user profile data returned from API
export interface UserProfileData {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt?: Date | string | null;
  profile?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    position?: string | null;
    department?: string | null;
    employeeId?: string | null;
    avatar?: string | null;
    bio?: string | null;
    dateOfBirth?: Date | string | null;
    gender?: string | null;
    emergencyContact?: EmergencyContactData | null;
  } | null;
  // Work center assignments
  workCenterAssignments?:
    | Array<{
        id: string;
        isPrimary: boolean;
        workCenter: WorkCenterData;
      }>
    | [];
  // User work center direct assignments
  UserWorkCenter?:
    | Array<{
        id: string;
        isResponsible: boolean;
        workCenter: WorkCenterData;
      }>
    | [];
  // Assigned operations
  assignedOperations?: OperationData[] | [];
}
