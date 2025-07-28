import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { generateSecureToken } from '@/lib/utils/token-generator'
import { ShareableDocType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { documentType, documentId, expirationDays = 30 } = body

    // Validate document type
    if (!Object.values(ShareableDocType).includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document type' },
        { status: 400 }
      )
    }

    // Verify document exists
    let document = null
    switch (documentType) {
      case 'BILLING_STATEMENT':
        document = await prisma.billingStatement.findUnique({
          where: { id: documentId }
        })
        break
      case 'SALES_INVOICE':
        document = await prisma.salesInvoice.findUnique({
          where: { id: documentId }
        })
        break
      case 'DELIVERY_RECEIPT':
        document = await prisma.deliveryReceipt.findUnique({
          where: { id: documentId }
        })
        break
    }

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    // Generate secure token
    const token = generateSecureToken()
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)

    // Create shareable link
    const shareableLink = await prisma.shareableLink.create({
      data: {
        token,
        documentType,
        documentId,
        expiresAt,
        createdBy: session.user.id
      }
    })

    // Generate URL based on document type
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    let shareUrl = ''
    switch (documentType) {
      case 'BILLING_STATEMENT':
        shareUrl = `${baseUrl}/billing-statement/share/${token}`
        break
      case 'SALES_INVOICE':
        shareUrl = `${baseUrl}/sales-invoice/share/${token}`
        break
      case 'DELIVERY_RECEIPT':
        shareUrl = `${baseUrl}/delivery-receipt/share/${token}`
        break
    }

    return NextResponse.json({
      success: true,
      shareableLink: {
        id: shareableLink.id,
        token: shareableLink.token,
        url: shareUrl,
        expiresAt: shareableLink.expiresAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating shareable link:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}