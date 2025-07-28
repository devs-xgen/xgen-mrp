import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ShareableDocType } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const documentType = searchParams.get('documentType')
    const documentId = searchParams.get('documentId')

    if (!documentType || !documentId) {
      return NextResponse.json(
        { error: "Document type and document ID are required" },
        { status: 400 }
      )
    }

    // Validate document type
    const validDocumentTypes = Object.values(ShareableDocType)
    const mappedDocumentType = documentType.toUpperCase().replace('-', '_') as ShareableDocType
    
    if (!validDocumentTypes.includes(mappedDocumentType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      )
    }

    // Fetch existing shareable links for the document
    const shareableLinks = await prisma.shareableLink.findMany({
      where: {
        documentType: mappedDocumentType,
        documentId: documentId,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Check link status and expiration for each link
    const now = new Date()
    const linksWithStatus = shareableLinks.map(link => {
      let status = 'active'
      
      if (link.isRevoked) {
        status = 'revoked'
      } else if (link.expiresAt < now) {
        status = 'expired'
      }

      // Generate the full URL based on document type
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
      let shareUrl = ''
      switch (link.documentType) {
        case ShareableDocType.BILLING_STATEMENT:
          shareUrl = `${baseUrl}/billing-statement/share/${link.token}`
          break
        case ShareableDocType.SALES_INVOICE:
          shareUrl = `${baseUrl}/sales-invoice/share/${link.token}`
          break
        case ShareableDocType.DELIVERY_RECEIPT:
          shareUrl = `${baseUrl}/delivery-receipt/share/${link.token}`
          break
      }

      return {
        id: link.id,
        token: link.token,
        url: shareUrl,
        documentType: link.documentType,
        documentId: link.documentId,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        isRevoked: link.isRevoked,
        revokedAt: link.revokedAt,
        accessCount: link.accessCount,
        lastAccessedAt: link.lastAccessedAt,
        lastAccessedIp: link.lastAccessedIp,
        status,
        createdBy: {
          id: link.createdByUser.id,
          email: link.createdByUser.email,
        },
      }
    })

    return NextResponse.json({
      links: linksWithStatus,
    })
  } catch (error) {
    console.error('[SHARE_LINKS_LIST_GET]', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}