import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { ShareableDocType } from "@prisma/client"
import {
  transformBillingStatementToShared,
  transformSalesInvoiceToShared,
  transformDeliveryReceiptToShared,
  extractCustomerInfo,
  getCompanyInfo,
  sanitizeDocumentData,
  SharedBillingStatement,
  SharedSalesInvoice,
  SharedDeliveryReceipt,
  SharedCustomerInfo,
  SharedCompanyInfo
} from "@/lib/utils/shared-document-transformers"
import {
  checkRateLimitForApi,
  logRateLimitViolation,
  RATE_LIMIT_CONFIGS,
} from "@/lib/utils/rate-limiter"
import {
  logDocumentAccessed,
  logDocumentAccessDenied,
  logRateLimitExceeded,
  detectSuspiciousActivity,
  logSuspiciousActivity
} from "@/lib/utils/audit-logger"

interface SharedDocumentResponse {
  success: boolean
  document?: {
    type: ShareableDocType
    data: SharedBillingStatement | SharedSalesInvoice | SharedDeliveryReceipt
    metadata: {
      customerInfo: SharedCustomerInfo
      companyInfo: SharedCompanyInfo
    }
  }
  error?: string
}



async function logAccess(token: string, ip: string): Promise<void> {
  try {
    await prisma.shareableLink.update({
      where: { token },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
        lastAccessedIp: ip
      }
    })
  } catch (error) {
    console.error('[SHARED_DOCUMENT_ACCESS_LOG]', error)
    // Don't fail the request if logging fails
  }
}

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params
    
    // Get client IP for rate limiting and logging
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Check rate limit
    const rateLimitResult = checkRateLimitForApi(ip, RATE_LIMIT_CONFIGS.SHARED_DOCUMENTS)
    
    if (!rateLimitResult.allowed) {
      // Log the violation
      logRateLimitViolation(ip, `/api/shared-documents/${token}`, userAgent, {
        token: token.substring(0, 8) + '...', // Log partial token for debugging
        retryAfter: rateLimitResult.retryAfter
      })

      // Log to audit system
      await logRateLimitExceeded({
        endpoint: `/api/shared-documents/${token}`,
        limit: RATE_LIMIT_CONFIGS.SHARED_DOCUMENTS.maxRequests,
        windowMs: RATE_LIMIT_CONFIGS.SHARED_DOCUMENTS.windowMs,
        violations: 1, // This would be better if we tracked it
        ip,
        userAgent,
        additionalInfo: {
          token: token.substring(0, 8) + '...'
        }
      })
      
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again later." },
        { 
          status: 429, 
          headers: { 
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.SHARED_DOCUMENTS.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          } 
        }
      )
    }

    // Find the shareable link
    const shareableLink = await prisma.shareableLink.findUnique({
      where: { token },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    if (!shareableLink) {
      // Log access denied
      await logDocumentAccessDenied({
        token,
        reason: 'not-found',
        ip,
        userAgent
      })
      
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      )
    }

    // Check if link is revoked
    if (shareableLink.isRevoked) {
      // Log access denied
      await logDocumentAccessDenied({
        token,
        reason: 'revoked',
        documentType: shareableLink.documentType,
        documentId: shareableLink.documentId,
        ip,
        userAgent
      })
      
      return NextResponse.json(
        { success: false, error: "Link has been revoked" },
        { status: 403 }
      )
    }

    // Check if link is expired
    if (new Date() > shareableLink.expiresAt) {
      // Log access denied
      await logDocumentAccessDenied({
        token,
        reason: 'expired',
        documentType: shareableLink.documentType,
        documentId: shareableLink.documentId,
        ip,
        userAgent
      })
      
      return NextResponse.json(
        { success: false, error: "Link has expired" },
        { status: 410 }
      )
    }

    // Log the access
    await logAccess(token, ip)

    // Check for suspicious activity
    const suspiciousActivity = await detectSuspiciousActivity(ip)
    if (suspiciousActivity.isSuspicious) {
      await logSuspiciousActivity({
        activityType: 'EXCESSIVE_DOCUMENT_ACCESS',
        riskLevel: suspiciousActivity.riskLevel,
        details: {
          reasons: suspiciousActivity.reasons,
          token: token.substring(0, 8) + '...',
          documentType: shareableLink.documentType
        },
        ip,
        userAgent
      })
    }

    // Retrieve the document based on type
    let transformedDocument: SharedBillingStatement | SharedSalesInvoice | SharedDeliveryReceipt | null = null
    let customerInfo: SharedCustomerInfo | null = null

    try {
      switch (shareableLink.documentType) {
        case ShareableDocType.BILLING_STATEMENT:
          const billingStatement = await prisma.billingStatement.findUnique({
            where: { id: shareableLink.documentId },
            include: {
              customer: true,
              customerOrder: {
                include: {
                  customer: true
                }
              },
              productionOrder: {
                include: {
                  product: true,
                  productVariant: true
                }
              },
              salesInvoice: {
                include: {
                  invoiceItems: {
                    include: {
                      material: true,
                      product: true
                    }
                  }
                }
              },
              deliveryReceipts: true,
              createdByUser: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          })
          
          if (billingStatement) {
            // Transform the billing statement
            transformedDocument = transformBillingStatementToShared(billingStatement)
            
            // Extract customer info
            customerInfo = extractCustomerInfo(
              billingStatement.customer,
              billingStatement.customerOrder,
              billingStatement.customerName
            )
          }
          break

        case ShareableDocType.SALES_INVOICE:
          const salesInvoice = await prisma.salesInvoice.findUnique({
            where: { id: shareableLink.documentId },
            include: {
              billingStatement: {
                include: {
                  customer: true,
                  customerOrder: {
                    include: {
                      customer: true
                    }
                  }
                }
              },
              invoiceItems: {
                include: {
                  material: true,
                  product: true
                }
              },
              createdByUser: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          })
          
          if (salesInvoice) {
            // Transform the sales invoice
            transformedDocument = transformSalesInvoiceToShared(salesInvoice)
            
            // Extract customer info from billing statement
            if (salesInvoice.billingStatement) {
              customerInfo = extractCustomerInfo(
                salesInvoice.billingStatement.customer,
                salesInvoice.billingStatement.customerOrder,
                salesInvoice.billingStatement.customerName
              )
            }
          }
          break

        case ShareableDocType.DELIVERY_RECEIPT:
          const deliveryReceipt = await prisma.deliveryReceipt.findUnique({
            where: { id: shareableLink.documentId },
            include: {
              billingStatement: {
                include: {
                  customer: true,
                  customerOrder: {
                    include: {
                      customer: true
                    }
                  }
                }
              },
              createdByUser: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          })
          
          if (deliveryReceipt) {
            // Transform the delivery receipt
            transformedDocument = transformDeliveryReceiptToShared(deliveryReceipt)
            
            // Extract customer info from billing statement
            if (deliveryReceipt.billingStatement) {
              customerInfo = extractCustomerInfo(
                deliveryReceipt.billingStatement.customer,
                deliveryReceipt.billingStatement.customerOrder,
                deliveryReceipt.billingStatement.customerName
              )
            }
          }
          break

        default:
          return NextResponse.json(
            { success: false, error: "Invalid document type" },
            { status: 400 }
          )
      }
    } catch (error) {
      console.error('[SHARED_DOCUMENT_RETRIEVAL]', error)
      return NextResponse.json(
        { success: false, error: "Error retrieving document" },
        { status: 500 }
      )
    }

    if (!transformedDocument) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      )
    }

    // Get company information
    const companyInfo = getCompanyInfo()

    // Sanitize the transformed document to remove sensitive fields
    const sanitizedDocument = sanitizeDocumentData(transformedDocument)

    // Log successful document access
    await logDocumentAccessed({
      shareableLinkId: shareableLink.id,
      documentType: shareableLink.documentType,
      documentId: shareableLink.documentId,
      accessCount: shareableLink.accessCount + 1, // This will be incremented by logAccess
      success: true,
      ip,
      userAgent
    })

    const response: SharedDocumentResponse = {
      success: true,
      document: {
        type: shareableLink.documentType,
        data: sanitizedDocument as SharedBillingStatement | SharedSalesInvoice | SharedDeliveryReceipt,
        metadata: {
          customerInfo: customerInfo || {
            name: "Unknown Customer",
            email: null,
            phone: null,
            address: null,
            city: null,
            state: null,
            country: null,
            postalCode: null,
            tinNumber: null
          },
          companyInfo
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[SHARED_DOCUMENT_GET]', error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}