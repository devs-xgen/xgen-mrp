"use server";

import { prisma } from "@/lib/db";
import { UserProfile } from "@prisma/client";
import { z } from "zod";
import * as bcryptjs from "bcryptjs";
import { 
  profileUpdateSchema, 
  passwordChangeSchema,
  ProfileUpdateData,
  PasswordChangeData
} from "@/types/worker/profile";

/**
 * Get user profile information
 */
export async function getUserProfile(userId: string) {
  console.log("getUserProfile called with userId:", userId);
  
  if (!userId) {
    console.error("getUserProfile: No userId provided");
    throw new Error("User ID is required");
  }
  
  try {
    // Check if user exists first
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!userExists) {
      console.error("getUserProfile: User not found for ID:", userId);
      throw new Error("User not found");
    }
    
    // Now fetch the full user data with all related information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        // Include detailed profile information
        profile: {
          include: {
            // Include emergency contact information
            emergencyContact: true
          }
        },
        // Include work center assignments
        workCenterAssignments: {
          include: {
            workCenter: true,
          },
        },
        // Include directly assigned work centers
        UserWorkCenter: {
          include: {
            workCenter: true,
          },
        },
        // Include operations assigned to the user
        assignedOperations: {
          include: {
            workCenter: true,
            productionOrder: {
              include: {
                product: true
              }
            }
          },
          where: {
            status: {
              in: ["PENDING", "IN_PROGRESS", "ACTIVE"]
            }
          },
          take: 5, // Limit to avoid too much data
          orderBy: {
            startTime: 'asc'
          }
        }
      },
    });
    
    console.log("getUserProfile: User data retrieved successfully");
    
    return user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile");
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(userId: string, data: ProfileUpdateData) {
  try {
    // Validate input data
    const validatedData = profileUpdateSchema.parse(data);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update or create profile
    if (user.profile) {
      await prisma.userProfile.update({
        where: { id: user.profile.id },
        data: validatedData,
      });
    } else {
      await prisma.userProfile.create({
        data: {
          ...validatedData,
          userId,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }
    throw new Error("Failed to update user profile");
  }
}

/**
 * Update user password with time restriction (not more than once every 30 days)
 */
export async function updateUserPassword(userId: string, data: PasswordChangeData) {
  try {
    // Validate input data
    const validatedData = passwordChangeSchema.parse(data);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Verify current password
    const isPasswordValid = await bcryptjs.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Current password is incorrect",
      };
    }

    // Check if password was changed in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // Retrieve password change history from transaction table
      const recentPasswordChange = await prisma.transaction.findFirst({
        where: {
          handledBy: userId,
          paymentMethod: "OTHER", // Using this field to track password changes
          notes: "PASSWORD_CHANGE",
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (recentPasswordChange) {
        const daysSinceLastChange = Math.floor(
          (Date.now() - recentPasswordChange.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysRemaining = 30 - daysSinceLastChange;

        return {
          success: false,
          error: `Password can only be changed once every 30 days. Please try again in ${daysRemaining} days.`,
        };
      }
    } catch (err) {
      console.error("Error checking password change history:", err);
      // Continue with password change even if we can't check history
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(validatedData.newPassword, 10);

    try {
      // Update user password directly without creating a transaction record
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      // Create an Alert record to track password changes instead of using Transaction
      await prisma.alert.create({
        data: {
          type: "SECURITY",
          title: "Password Change",
          message: "User password was changed",
          status: "COMPLETED",
          priority: "MEDIUM",
          metadata: {
            userId: userId,
            changeType: "PASSWORD_CHANGE",
            changedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
        },
      });

      return { success: true };
    } catch (innerError) {
      console.error("Error during password update operation:", innerError);
      return { 
        success: false, 
        error: innerError instanceof Error ? innerError.message : "Failed to update password" 
      };
    }
  } catch (error) {
    console.error("Error updating user password:", error);
    
    // Return a user-friendly error
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { 
        success: false, 
        error: `Validation error: ${errorMessages}` 
      };
    }
    
    // Return other errors as string messages
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update password" 
    };
  }
}

/**
 * Check if a user can change their password (not changed in the last 30 days)
 */
export async function canChangePassword(userId: string) {
  try {
    if (!userId) {
      return {
        canChange: false,
        message: "User ID is required",
        daysRemaining: null
      };
    }

    // Check if password was changed in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Retrieve password change history from alert table
    const recentPasswordChange = await prisma.alert.findFirst({
      where: {
        createdBy: userId,
        type: "SECURITY",
        title: "Password Change",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentPasswordChange) {
      const daysSinceLastChange = Math.floor(
        (Date.now() - recentPasswordChange.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = 30 - daysSinceLastChange;

      return {
        canChange: false,
        message: `Password can only be changed once every 30 days. Please try again in ${daysRemaining} days.`,
        lastChanged: recentPasswordChange.createdAt,
        daysRemaining
      };
    }

    return {
      canChange: true,
      message: null,
      daysRemaining: null
    };
  } catch (error) {
    console.error("Error checking password change eligibility:", error);
    return {
      canChange: true, // Allow changing password if we can't check history
      message: null,
      daysRemaining: null,
      error: "Could not verify password change history"
    };
  }
} 