import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { linkId } = params

    // Find the shareable link
    const shareableLink = await prisma.shareableLink.findUnique({
      where: { id: linkId }
    })

    if (!shareableLink) {
      return NextResponse.json(
        { success: false, error: 'Share link not found' },
        { status: 404 }
      )
    }

    if (shareableLink.isRevoked) {
      return NextResponse.json(
        { success: false, error: 'Share link is already revoked' },
        { status: 400 }
      )
    }

    // Revoke the link
    await prisma.shareableLink.update({
      where: { id: linkId },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Share link revoked successfully'
    })

  } catch (error) {
    console.error('Error revoking shareable link:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}