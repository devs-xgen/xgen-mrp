"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { z } from "zod"

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
})

export async function findUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    })

    if (!user) {
      return { success: false, error: "No account found with this email address." }
    }

    return { success: true, data: { email: user.email, role: user.role } }
  } catch (error) {
    console.error("Error finding user:", error)
    return { success: false, error: "An error occurred. Please try again." }
  }
}

export async function resetPassword(data: {
  email: string
  newPassword: string
  confirmPassword: string
}) {
  try {
    const validated = resetPasswordSchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    })

    if (!user) {
      return { success: false, error: "No account found with this email address." }
    }

    const hashedPassword = await bcrypt.hash(validated.newPassword, 12)

    await prisma.user.update({
      where: { email: validated.email.toLowerCase().trim() },
      data: { password: hashedPassword },
    })

    return { success: true, message: "Password updated successfully. You can now log in." }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("Error resetting password:", error)
    return { success: false, error: "An error occurred. Please try again." }
  }
}
