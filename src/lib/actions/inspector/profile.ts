"use server";

import { prisma } from "@/lib/db";
import { UserProfile } from "@prisma/client";
import { z } from "zod";
import * as bcryptjs from "bcryptjs";
import {
  inspectorProfileUpdateSchema,
  inspectorPasswordChangeSchema,
  InspectorProfileUpdateData,
  InspectorPasswordChangeData,
  InspectorProfile,
} from "@/types/inspector/profile";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";



// import { getInspectorProfile } from "@/lib/actions/inspector/profile";

// async function loadInspectorProfile(userId: string, email?: string) {
//   try {
//     const profile = await getInspectorProfile(userId, email);
//     console.log("Inspector Profile:", profile);
//     // Use profile data here
//   } catch (error) {
//     console.error("Error loading inspector profile:", error);
//   }
// }

/**
 * Get inspector profile information
 */
export async function getInspectorProfileById(userId: string, email?: string) {
  if (!userId && !email) throw new Error("User ID or email is required");

  let inspector = null;

  if (userId) {
    inspector = await prisma.inspector.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  if (!inspector && email) {
    inspector = await prisma.inspector.findUnique({
      where: { email },
      include: { user: true },
    });
  }

  if (!inspector) {
    throw new Error("Inspector not found");
  }

  return inspector;
}

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
 * Update inspector profile information
 */
export async function updateInspectorProfile(userId: string, data: InspectorProfileUpdateData) {
  try {
    const validatedData = inspectorProfileUpdateSchema.parse(data);

    const inspector = await prisma.inspector.findUnique({ where: { userId } });
    if (!inspector) throw new Error("Inspector not found");

    await prisma.inspector.update({
      where: { inspectorId: inspector.inspectorId },
      data: validatedData,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating inspector profile:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }
    throw new Error("Failed to update inspector profile");
  }
}

/**
 * Update inspector password with 30-day cooldown
 */
export async function updateInspectorPassword(userId: string, data: InspectorPasswordChangeData) {
  try {
    const validatedData = inspectorPasswordChangeSchema.parse(data);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User not found" };

    const isPasswordValid = await bcryptjs.compare(validatedData.currentPassword, user.password);
    if (!isPasswordValid) return { success: false, error: "Incorrect current password" };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPasswordChange = await prisma.alert.findFirst({
      where: {
        createdBy: userId,
        type: "SECURITY",
        title: "Password Change",
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
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

    const hashedPassword = await bcryptjs.hash(validatedData.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, updatedAt: new Date() },
    });

    await prisma.alert.create({
      data: {
        type: "SECURITY",
        title: "Password Change",
        message: "Inspector password was changed",
        status: "COMPLETED",
        priority: "MEDIUM",
        metadata: {
          userId,
          changeType: "PASSWORD_CHANGE",
          changedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating inspector password:", error);
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return {
        success: false,
        error: `Validation error: ${errorMessages}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update password",
    };
  }
}

/**
 * Check if inspector can change password (30-day cooldown)
 */
export async function canInspectorChangePassword(userId: string) {
  try {
    if (!userId) {
      return {
        canChange: false,
        message: "User ID is required",
        daysRemaining: null,
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentChange = await prisma.alert.findFirst({
      where: {
        createdBy: userId,
        type: "SECURITY",
        title: "Password Change",
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentChange) {
      const daysSince = Math.floor(
        (Date.now() - recentChange.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = 30 - daysSince;

      return {
        canChange: false,
        message: `Password can only be changed every 30 days. Try again in ${daysRemaining} days.`,
        lastChanged: recentChange.createdAt,
        daysRemaining,
      };
    }

    return {
      canChange: true,
      message: null,
      daysRemaining: null,
    };
  } catch (error) {
    console.error("Error checking inspector password cooldown:", error);
    return {
      canChange: true,
      message: null,
      daysRemaining: null,
      error: "Could not verify password history",
    };
  }
}
