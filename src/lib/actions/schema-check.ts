'use server'

import { prisma } from "@/lib/db"

export async function checkPrismaSchema() {
  try {
    // Get a list of all model names available in the Prisma client
    const modelNames = Object.keys(prisma).filter(key => 
      typeof prisma[key as keyof typeof prisma] === 'object' && 
      !['$on', '$use', '$connect', '$disconnect', '$executeRaw', '$queryRaw', '$transaction'].includes(key)
    )
    
    // Check if ActivityLog model exists
    const hasActivityLog = modelNames.includes('activityLog')
    
    return {
      success: true,
      models: modelNames,
      hasActivityLog,
      message: hasActivityLog 
        ? 'ActivityLog model is available in Prisma client' 
        : 'ActivityLog model is NOT available in Prisma client'
    }
  } catch (error) {
    console.error('Error checking Prisma schema:', error)
    return {
      success: false,
      error: String(error),
      message: 'Failed to check Prisma schema'
    }
  }
} 