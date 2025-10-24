// src/lib/actions/shareable-link.ts
"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ShareableDocType } from "@prisma/client";
import { randomBytes } from "crypto";

/**
 * Generate a secure shareable link token
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create or get existing shareable link for a product
 */
export async function createProductShareableLink(productId: string, expiryDays: number = 30) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Check for existing non-expired, non-revoked link
    const existingLink = await prisma.shareableLink.findFirst({
      where: {
        documentType: ShareableDocType.PRODUCT,
        documentId: productId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingLink) {
      return {
        success: true,
        link: existingLink,
      };
    }

    // Create new shareable link
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const newLink = await prisma.shareableLink.create({
      data: {
        token,
        documentType: ShareableDocType.PRODUCT,
        documentId: productId,
        expiresAt,
        createdBy: session.user.id,
      },
    });

    return {
      success: true,
      link: newLink,
    };
  } catch (error) {
    console.error("Error creating shareable link:", error);
    return {
      success: false,
      error: "Failed to create shareable link",
    };
  }
}

/**
 * Get product data by shareable token (for public access)
 */
export async function getProductByShareableToken(token: string) {
  try {
    // Find the shareable link
    const shareableLink = await prisma.shareableLink.findUnique({
      where: { token },
    });

    if (!shareableLink) {
      return { success: false, error: "Invalid share link" };
    }

    // Check if link is expired or revoked
    if (shareableLink.isRevoked) {
      return { success: false, error: "This link has been revoked" };
    }

    if (shareableLink.expiresAt < new Date()) {
      return { success: false, error: "This link has expired" };
    }

    // Update access count and last accessed
    await prisma.shareableLink.update({
      where: { id: shareableLink.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Get product data with variants
    const product = await prisma.product.findUnique({
      where: { id: shareableLink.documentId },
      include: {
        category: true,
        variants: {
          include: {
            attributeValues: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    return {
      success: true,
      product,
      shareableLink,
    };
  } catch (error) {
    console.error("Error fetching product by token:", error);
    return {
      success: false,
      error: "Failed to fetch product data",
    };
  }
}

/**
 * Revoke a shareable link
 */
export async function revokeShareableLink(linkId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const link = await prisma.shareableLink.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      return { success: false, error: "Link not found" };
    }

    // Only creator can revoke (or admin)
    if (link.createdBy !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized to revoke this link" };
    }

    await prisma.shareableLink.update({
      where: { id: linkId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error revoking link:", error);
    return { success: false, error: "Failed to revoke link" };
  }
}

/**
 * Get all shareable links for a product
 */
export async function getProductShareableLinks(productId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const links = await prisma.shareableLink.findMany({
      where: {
        documentType: ShareableDocType.PRODUCT,
        documentId: productId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return { success: true, links };
  } catch (error) {
    console.error("Error fetching shareable links:", error);
    return { success: false, error: "Failed to fetch shareable links" };
  }
}

/**
 * Create or get existing shareable link for a production order
 */
export async function createProductionOrderShareableLink(productionOrderId: string, expiryDays: number = 30) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if production order exists
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
    });

    if (!productionOrder) {
      return { success: false, error: "Production order not found" };
    }

    // Check for existing non-expired, non-revoked link
    const existingLink = await prisma.shareableLink.findFirst({
      where: {
        documentType: ShareableDocType.PRODUCTION_ORDER,
        documentId: productionOrderId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingLink) {
      return {
        success: true,
        link: existingLink,
      };
    }

    // Create new shareable link
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const newLink = await prisma.shareableLink.create({
      data: {
        token,
        documentType: ShareableDocType.PRODUCTION_ORDER,
        documentId: productionOrderId,
        expiresAt,
        createdBy: session.user.id,
      },
    });

    return {
      success: true,
      link: newLink,
    };
  } catch (error) {
    console.error("Error creating production order shareable link:", error);
    return {
      success: false,
      error: "Failed to create shareable link",
    };
  }
}

/**
 * Get production order data by shareable token (for public access)
 */
export async function getProductionOrderByShareableToken(token: string) {
  try {
    // Find the shareable link
    const shareableLink = await prisma.shareableLink.findUnique({
      where: { token },
    });

    if (!shareableLink) {
      return { success: false, error: "Invalid share link" };
    }

    // Check if link is expired or revoked
    if (shareableLink.isRevoked) {
      return { success: false, error: "This link has been revoked" };
    }

    if (shareableLink.expiresAt < new Date()) {
      return { success: false, error: "This link has expired" };
    }

    // Update access count and last accessed
    await prisma.shareableLink.update({
      where: { id: shareableLink.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Get production order data with all related information
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: shareableLink.documentId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        productVariant: {
          include: {
            attributeValues: {
              include: {
                attribute: true,
              },
            },
          },
        },
        operations: {
          include: {
            workCenter: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            sequenceNumber: "asc",
          },
        },
        qualityChecks: {
          include: {
            inspector: {
              select: {
                inspectorId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            checkDate: "desc",
          },
        },
        deliveryAssignment: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        customerOrder: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!productionOrder) {
      return { success: false, error: "Production order not found" };
    }

    return {
      success: true,
      productionOrder,
      shareableLink,
    };
  } catch (error) {
    console.error("Error fetching production order by token:", error);
    return {
      success: false,
      error: "Failed to fetch production order data",
    };
  }
}

/**
 * Get all shareable links for a production order
 */
export async function getProductionOrderShareableLinks(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const links = await prisma.shareableLink.findMany({
      where: {
        documentType: ShareableDocType.PRODUCTION_ORDER,
        documentId: productionOrderId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return { success: true, links };
  } catch (error) {
    console.error("Error fetching production order shareable links:", error);
    return { success: false, error: "Failed to fetch shareable links" };
  }
}
