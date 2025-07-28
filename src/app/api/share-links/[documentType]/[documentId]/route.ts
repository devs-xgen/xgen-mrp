import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { ShareableDocType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { documentType: string; documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { documentType, documentId } = params

    // Validate document type
    if (!Object.values(ShareableDocType).includes(documentType as ShareableDocType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    // Get all shareable links for the document
    const links = await prisma.shareableLink.findMany({
      where: {
        documentType: documentType as ShareableDocType,
        documentId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        createdByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ links })

  } catch (error) {
    console.error('Error fetching shareable links:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}