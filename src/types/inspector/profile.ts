import { z } from "zod";

// Schema for inspector profile update validation
export const inspectorProfileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  department: z.string().optional(),
  specialization: z.string().optional(),
  certificationLevel: z.string().optional(),
  yearsOfExperience: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

// Schema for inspector password change validation
export const inspectorPasswordChangeSchema = z
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

// Type for inspector profile update data (validated input)
export type InspectorProfileUpdateData = z.infer<typeof inspectorProfileUpdateSchema>;

// Type for inspector password change data (validated input)
export type InspectorPasswordChangeData = z.infer<typeof inspectorPasswordChangeSchema>;

// Interface for inspector profile data returned from API or database
export interface InspectorProfile {
  status: string;
  role: string;
  inspectorId: string;
  userId: string | null;
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
  createdAt: Date | string;
  updatedAt: Date | string;
  profile?: any; // optional, if you have nested profile object

  user?: {
    id: string;
    role: string;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    lastLoginAt?: Date | string | null;
  } | null;
}

