import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logShareLinkRevoked } from "@/lib/utils/audit-logger"

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const linkId = searchParams.get('linkId')

    if (!linkId) {
      return NextResponse.json(
        { success: false, message: "Link ID is required" },
        { status: 400 }
      )
    }

    // Check if the shareable link exists
    const existingLink = await prisma.shareableLink.findUnique({
      where: { id: linkId },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!existingLink) {
      return NextResponse.json(
        { success: false, message: "Shareable link not found" },
        { status: 404 }
      )
    }

    // Check if the link is already revoked
    if (existingLink.isRevoked) {
      return NextResponse.json(
        { success: false, message: "Link is already revoked" },
        { status: 400 }
      )
    }

    // Revoke the shareable link
    const revokedLink = await prisma.shareableLink.update({
      where: { id: linkId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    })

    // Get client IP for audit logging
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Log the revocation action for audit purposes
    await logShareLinkRevoked(session.user.id, {
      shareableLinkId: linkId,
      documentType: existingLink.documentType,
      documentId: existingLink.documentId,
      reason: 'Manual revocation by user',
      ip,
      userAgent,
      additionalInfo: {
        originalCreatedBy: existingLink.createdByUser.email,
        revokedBy: session.user.email,
        revokedAt: revokedLink.revokedAt?.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Shareable link has been successfully revoked",
      revokedLink: {
        id: revokedLink.id,
        isRevoked: revokedLink.isRevoked,
        revokedAt: revokedLink.revokedAt,
      },
    })
  } catch (error) {
    console.error('[SHARE_LINKS_REVOKE_DELETE]', error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}