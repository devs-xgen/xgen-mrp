"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { Role, UserStatus } from "@prisma/client";
import { UserData } from "@/types/admin/user";
import { createInspectorForUser, linkUserToInspector } from "./user-inspector";

// Types for user creation and updates
interface CreateUserInput {
  email: string;
  password: string;
  role: Role;
  profile: {
    firstName: string;
    lastName: string;
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
  };
  // Inspector specific fields
  isInspector?: boolean;
  inspectorOption?: "new" | "existing";
  existingInspectorId?: string;
  phoneNumber?: string;
  specialization?: string;
  certificationLevel?: string;
  yearsOfExperience?: number;
  notes?: string;
}

interface UpdateUserInput {
  id: string;
  role?: Role;
  status?: UserStatus;
  profile?: {
    firstName?: string;
    lastName?: string;
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
  };
}

/**
 * Get all users with their profiles
 */
export async function getUsers(): Promise<UserData[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const users = await prisma.user.findMany({
      include: {
        profile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Remove password field from response
    const sanitizedUsers = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as UserData;
    });

    return sanitizedUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}

/**
 * Create a new user with optional inspector relationship
 */
export async function createUser(data: CreateUserInput): Promise<UserData> {
  console.log("🚀 SERVER ACTION: createUser called");
  console.log("📥 SERVER: Received data:", JSON.stringify(data, null, 2));

  try {
    console.log("🔐 SERVER: Checking authentication...");
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.error("❌ SERVER: No session or user found");
      console.error("Session:", session);
      throw new Error("Unauthorized: Please log in to create users");
    }

    console.log("✅ SERVER: User authenticated:", session.user.email);

    // Validate required fields
    console.log("🔍 SERVER: Validating required fields...");
    if (!data.email || !data.password || !data.role) {
      console.error("❌ SERVER: Missing basic required fields");
      console.error(
        "Email:",
        !!data.email,
        "Password:",
        !!data.password,
        "Role:",
        !!data.role
      );
      throw new Error(
        "Missing required fields: email, password, and role are required"
      );
    }

    if (!data.profile?.firstName || !data.profile?.lastName) {
      console.error("❌ SERVER: Missing profile required fields");
      console.error(
        "FirstName:",
        !!data.profile?.firstName,
        "LastName:",
        !!data.profile?.lastName
      );
      throw new Error("First name and last name are required");
    }

    console.log("✅ SERVER: All required fields validation passed");

    // Validate role enum
    console.log("🔍 SERVER: Validating role enum...");
    if (!Object.values(Role).includes(data.role)) {
      console.error("❌ SERVER: Invalid role provided:", data.role);
      console.error("Valid roles:", Object.values(Role));
      throw new Error(
        `Invalid role. Must be one of: ${Object.values(Role).join(", ")}`
      );
    }
    console.log("✅ SERVER: Role validation passed:", data.role);

    // Check if user already exists
    console.log("🔍 SERVER: Checking if user already exists...");
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.error("❌ SERVER: User already exists with email:", data.email);
      throw new Error("User with this email already exists");
    }
    console.log("✅ SERVER: Email is available");

    // Hash password
    console.log("🔒 SERVER: Hashing password...");
    const hashedPassword = await hash(data.password, 12);
    console.log("✅ SERVER: Password hashed successfully");

    // Create user with profile
    console.log("📝 SERVER: Creating user in database...");
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        status: UserStatus.ACTIVE,
        createdBy: session.user.id,
        profile: {
          create: {
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            employeeId: data.profile.employeeId || null,
            department: data.profile.department || null,
            position: data.profile.position || null,
            phoneNumber: null,
            address: null,
            city: null,
            state: null,
            country: null,
            postalCode: null,
            dateOfBirth: null,
            gender: null,
            avatar: null,
            bio: null,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    console.log("🎉 SERVER: User created successfully in database!");
    console.log("👤 SERVER: Created user ID:", user.id);

    // Handle inspector relationship if needed
    if (data.isInspector) {
      console.log("👮 SERVER: Handling inspector relationship...");
      try {
        if (data.inspectorOption === "existing" && data.existingInspectorId) {
          console.log(
            "🔗 SERVER: Linking to existing inspector:",
            data.existingInspectorId
          );
          // Link the user to an existing inspector
          await linkUserToInspector(user.id, data.existingInspectorId);
          console.log("✅ SERVER: Successfully linked to existing inspector");
        } else if (data.inspectorOption === "new") {
          console.log("👮‍♂️ SERVER: Creating new inspector...");
          // Create a new inspector and link to user
          await createInspectorForUser(user.id, {
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber || null,
            department: data.profile.department || null,
            specialization: data.specialization || null,
            certificationLevel: data.certificationLevel || null,
            yearsOfExperience: data.yearsOfExperience || null,
            notes: data.notes || null,
          });
          console.log("✅ SERVER: Successfully created new inspector");
        }
      } catch (inspectorError) {
        console.error(
          "❌ SERVER: Error creating inspector relationship:",
          inspectorError
        );
        // Note: We don't delete the user here as the basic user creation was successful
        // The inspector relationship can be created later if needed
        throw new Error(
          `User created but failed to create inspector: ${inspectorError instanceof Error ? inspectorError.message : "Unknown error"}`
        );
      }
    } else {
      console.log("ℹ️ SERVER: No inspector relationship requested");
    }

    // Revalidate the users page
    console.log("🔄 SERVER: Revalidating users page...");
    revalidatePath("/admin/users");

    // Remove password from response
    console.log("🔒 SERVER: Removing password from response...");
    const { password: _, ...userWithoutPassword } = user;

    console.log("✅ SERVER: User creation completed successfully!");
    return userWithoutPassword as UserData;
  } catch (error) {
    console.error("💥 SERVER: Error creating user:", error);
    console.error("💥 SERVER: Error type:", typeof error);
    console.error(
      "💥 SERVER: Error message:",
      error instanceof Error ? error.message : "Unknown"
    );
    console.error(
      "💥 SERVER: Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );

    // Handle Prisma-specific errors
    if (error && typeof error === "object" && "code" in error) {
      console.error(
        "🔍 SERVER: Prisma error detected, code:",
        (error as any).code
      );
      if ((error as any).code === "P2002") {
        console.error("📧 SERVER: Duplicate email constraint violation");
        throw new Error("A user with this email already exists");
      }
    }

    console.error("🚨 SERVER: Throwing error to client");
    throw error instanceof Error ? error : new Error("Failed to create user");
  }
}

/**
 * Update an existing user
 */
export async function updateUser(data: UpdateUserInput): Promise<UserData> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: data.id },
      include: { profile: true },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Prepare update data
    const updateData: any = {
      modifiedBy: session.user.id,
      updatedAt: new Date(),
    };

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    // Handle profile updates
    if (data.profile) {
      updateData.profile = {
        update: {
          ...(data.profile.firstName !== undefined && {
            firstName: data.profile.firstName,
          }),
          ...(data.profile.lastName !== undefined && {
            lastName: data.profile.lastName,
          }),
          ...(data.profile.employeeId !== undefined && {
            employeeId: data.profile.employeeId,
          }),
          ...(data.profile.department !== undefined && {
            department: data.profile.department,
          }),
          ...(data.profile.position !== undefined && {
            position: data.profile.position,
          }),
        },
      };
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: data.id },
      data: updateData,
      include: {
        profile: true,
      },
    });

    // Revalidate the users page
    revalidatePath("/admin/users");

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as UserData;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error instanceof Error ? error : new Error("Failed to update user");
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Delete user (cascade will handle profile deletion)
    await prisma.user.delete({
      where: { id },
    });

    // Revalidate the users page
    revalidatePath("/admin/users");
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error instanceof Error ? error : new Error("Failed to delete user");
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<UserData | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return null;
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as UserData;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to fetch user");
  }
}

/**
 * Change user status
 */
export async function changeUserStatus(
  id: string,
  status: UserStatus
): Promise<UserData> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status,
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        profile: true,
      },
    });

    // Revalidate the users page
    revalidatePath("/admin/users");

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as UserData;
  } catch (error) {
    console.error("Error changing user status:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to change user status");
  }
}
