"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import {
  UserProfileData,
  ProfileUpdateData,
  EmergencyContactUpdateData,
  PasswordChangeData,
  ProfileActionResponse,
  PasswordChangeEligibility,
} from "@/types/shared/profile";

/**
 * Get user profile data by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfileData> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Users can only access their own profile unless they're admin
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      throw new Error("Forbidden: You can only access your own profile");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            emergencyContact: true,
          },
        },
        workCenterAssignments: {
          include: {
            workCenter: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          where: {
            status: "ACTIVE",
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile ? {
        id: user.profile.id,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phoneNumber: user.profile.phoneNumber,
        address: user.profile.address,
        city: user.profile.city,
        state: user.profile.state,
        country: user.profile.country,
        postalCode: user.profile.postalCode,
        department: user.profile.department,
        position: user.profile.position,
        employeeId: user.profile.employeeId,
        dateOfBirth: user.profile.dateOfBirth,
        gender: user.profile.gender,
        avatar: user.profile.avatar,
        bio: user.profile.bio,
      } : null,
      emergencyContact: user.profile?.emergencyContact ? {
        id: user.profile.emergencyContact.id,
        name: user.profile.emergencyContact.name,
        relationship: user.profile.emergencyContact.relationship,
        phoneNumber: user.profile.emergencyContact.phoneNumber,
        altPhoneNumber: user.profile.emergencyContact.altPhoneNumber,
        email: user.profile.emergencyContact.email,
        address: user.profile.emergencyContact.address,
      } : null,
      workCenterAssignments: user.workCenterAssignments,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<ProfileActionResponse<UserProfileData>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Users can only update their own profile unless they're admin
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return { success: false, error: "Forbidden: You can only update your own profile" };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    // Update or create profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        modifiedBy: session.user.id,
        profile: {
          upsert: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              phoneNumber: data.phoneNumber || null,
              address: data.address || null,
              city: data.city || null,
              state: data.state || null,
              country: data.country || null,
              postalCode: data.postalCode || null,
              department: data.department || null,
              position: data.position || null,
              employeeId: data.employeeId || null,
              dateOfBirth: data.dateOfBirth || null,
              gender: data.gender || null,
              bio: data.bio || null,
            },
            update: {
              firstName: data.firstName,
              lastName: data.lastName,
              phoneNumber: data.phoneNumber || null,
              address: data.address || null,
              city: data.city || null,
              state: data.state || null,
              country: data.country || null,
              postalCode: data.postalCode || null,
              department: data.department || null,
              position: data.position || null,
              employeeId: data.employeeId || null,
              dateOfBirth: data.dateOfBirth || null,
              gender: data.gender || null,
              bio: data.bio || null,
            },
          },
        },
      },
      include: {
        profile: {
          include: {
            emergencyContact: true,
          },
        },
        workCenterAssignments: {
          include: {
            workCenter: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          where: {
            status: "ACTIVE",
          },
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/${session.user.role.toLowerCase()}/profile`);
    revalidatePath(`/${session.user.role.toLowerCase()}/settings`);

    const profileData: UserProfileData = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      lastLoginAt: updatedUser.lastLoginAt,
      profile: updatedUser.profile ? {
        id: updatedUser.profile.id,
        firstName: updatedUser.profile.firstName,
        lastName: updatedUser.profile.lastName,
        phoneNumber: updatedUser.profile.phoneNumber,
        address: updatedUser.profile.address,
        city: updatedUser.profile.city,
        state: updatedUser.profile.state,
        country: updatedUser.profile.country,
        postalCode: updatedUser.profile.postalCode,
        department: updatedUser.profile.department,
        position: updatedUser.profile.position,
        employeeId: updatedUser.profile.employeeId,
        dateOfBirth: updatedUser.profile.dateOfBirth,
        gender: updatedUser.profile.gender,
        avatar: updatedUser.profile.avatar,
        bio: updatedUser.profile.bio,
      } : null,
      emergencyContact: updatedUser.profile?.emergencyContact ? {
        id: updatedUser.profile.emergencyContact.id,
        name: updatedUser.profile.emergencyContact.name,
        relationship: updatedUser.profile.emergencyContact.relationship,
        phoneNumber: updatedUser.profile.emergencyContact.phoneNumber,
        altPhoneNumber: updatedUser.profile.emergencyContact.altPhoneNumber,
        email: updatedUser.profile.emergencyContact.email,
        address: updatedUser.profile.emergencyContact.address,
      } : null,
      workCenterAssignments: updatedUser.workCenterAssignments,
    };

    return {
      success: true,
      data: profileData,
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}

/**
 * Update emergency contact information
 */
export async function updateEmergencyContact(
  userId: string,
  data: EmergencyContactUpdateData
): Promise<ProfileActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Users can only update their own emergency contact unless they're admin
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return { success: false, error: "Forbidden: You can only update your own emergency contact" };
    }

    // Check if user exists and has a profile
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        profile: {
          include: {
            emergencyContact: true,
          },
        },
      },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    if (!existingUser.profile) {
      return { success: false, error: "User profile not found. Please create a profile first." };
    }

    // Update or create emergency contact
    await prisma.emergencyContact.upsert({
      where: { profileId: existingUser.profile.id },
      create: {
        profileId: existingUser.profile.id,
        name: data.name,
        relationship: data.relationship,
        phoneNumber: data.phoneNumber,
        altPhoneNumber: data.altPhoneNumber || null,
        email: data.email || null,
        address: data.address || null,
      },
      update: {
        name: data.name,
        relationship: data.relationship,
        phoneNumber: data.phoneNumber,
        altPhoneNumber: data.altPhoneNumber || null,
        email: data.email || null,
        address: data.address || null,
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/${session.user.role.toLowerCase()}/profile`);
    revalidatePath(`/${session.user.role.toLowerCase()}/settings`);

    return {
      success: true,
      message: "Emergency contact updated successfully",
    };
  } catch (error) {
    console.error("Error updating emergency contact:", error);
    return {
      success: false,
      error: "Failed to update emergency contact",
    };
  }
}

/**
 * Check if user can change password (30-day cooldown)
 */
export async function canChangePassword(userId: string): Promise<PasswordChangeEligibility> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Users can only check their own password eligibility unless they're admin
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      throw new Error("Forbidden: You can only check your own password eligibility");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { updatedAt: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const lastPasswordChange = user.updatedAt;
    const daysSinceLastChange = Math.floor(
      (now.getTime() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
    );

    const cooldownPeriod = 30; // days
    const canChange = daysSinceLastChange >= cooldownPeriod;
    const daysRemaining = canChange ? 0 : cooldownPeriod - daysSinceLastChange;

    return {
      canChange,
      message: canChange 
        ? "You can change your password now." 
        : `Password can only be changed once every ${cooldownPeriod} days.`,
      daysRemaining,
      lastChanged: lastPasswordChange,
    };
  } catch (error) {
    console.error("Error checking password eligibility:", error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  data: PasswordChangeData
): Promise<ProfileActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Users can only update their own password unless they're admin
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return { success: false, error: "Forbidden: You can only update your own password" };
    }

    // Check password change eligibility
    const eligibility = await canChangePassword(userId);
    if (!eligibility.canChange) {
      return { 
        success: false, 
        error: eligibility.message || "Password change not allowed at this time" 
      };
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        modifiedBy: session.user.id,
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/${session.user.role.toLowerCase()}/profile`);
    revalidatePath(`/${session.user.role.toLowerCase()}/settings`);

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      error: "Failed to update password",
    };
  }
}