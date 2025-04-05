// src/lib/db.ts
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

// Create a Prisma client with the Accelerate extension for edge environments
const prisma = new PrismaClient().$extends(withAccelerate())

export { prisma }
export default prisma