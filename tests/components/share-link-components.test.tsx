import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { ShareLinkButton } from '@/components/shared/ShareLinkButton'
import { ShareLinkManager } from '@/components/shared/ShareLinkManager'
import { useToast } from '@/hooks/use-toast'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

const mockToast = vi.fn()
const mockUseToast = useToast as any

describe('ShareLinkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseToast.mockReturnValue({
      toast: mockToast,
      toasts: [],
      dismiss: vi.fn(),
    })
  })

  it('renders generate button initially', () => {
    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="test-id"
      />
    )

    expect(screen.getByText('Generate Share Link')).toBeInTheDocument()
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('shows loading state when generating', async () => {
    const mockFetch = fetch as any
    mockFetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          shareableLink: {
            id: 'test-id',
            token: 'test-token',
            url: 'http://localhost:3001/billing-statement/share/test-token',
            expiresAt: new Date().toISOString(),
          }
        })
      } as Response), 100))
    )

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="test-id"
      />
    )

    const button = screen.getByText('Generate Share Link')
    fireEvent.click(button)

    expect(screen.getByText('Generating...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows copy button after successful generation', async () => {
    const mockFetch = fetch as any
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        shareableLink: {
          id: 'test-id',
          token: 'test-token',
          url: 'http://localhost:3001/billing-statement/share/test-token',
          expiresAt: new Date().toISOString(),
        }
      })
    } as Response)

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="test-id"
      />
    )

    const generateButton = screen.getByText('Generate Share Link')
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Copy Link')).toBeInTheDocument()
    })

    expect(screen.getByText('Generate New')).toBeInTheDocument()
  })

  it('handles generation errors', async () => {
    const mockFetch = fetch as any
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: 'Document not found'
      })
    } as Response)

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="test-id"
      />
    )

    const button = screen.getByText('Generate Share Link')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Document not found",
        variant: "destructive",
      })
    })
  })

  it('calls onLinkGenerated callback when provided', async () => {
    const mockFetch = fetch as any
    const onLinkGenerated = vi.fn()
    const testUrl = 'http://localhost:3001/billing-statement/share/test-token'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        shareableLink: {
          id: 'test-id',
          token: 'test-token',
          url: testUrl,
          expiresAt: new Date().toISOString(),
        }
      })
    } as Response)

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="test-id"
        onLinkGenerated={onLinkGenerated}
      />
    )

    const button = screen.getByText('Generate Share Link')
    fireEvent.click(button)

    await waitFor(() => {
      expect(onLinkGenerated).toHaveBeenCalledWith(testUrl)
    })
  })
})

describe('ShareLinkManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseToast.mockReturnValue({
      toast: mockToast,
      toasts: [],
      dismiss: vi.fn(),
    })
  })

  it('renders loading state initially', () => {
    const mockFetch = fetch as any
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <ShareLinkManager
        documentType="billing-statement"
        documentId="test-id"
      />
    )

    expect(screen.getByText('Loading share links...')).toBeInTheDocument()
  })

  it('renders empty state when no links exist', async () => {
    const mockFetch = fetch as any
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ links: [] })
    } as Response)

    render(
      <ShareLinkManager
        documentType="billing-statement"
        documentId="test-id"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No share links have been created for this document yet.')).toBeInTheDocument()
    })
  })

  it('renders links when they exist', async () => {
    const mockFetch = fetch as any
    const testLinks = [
      {
        id: 'link-1',
        token: 'token-1',
        url: 'http://localhost:3001/billing-statement/share/token-1',
        documentType: 'BILLING_STATEMENT',
        documentId: 'test-id',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-02-01T00:00:00Z',
        isRevoked: false,
        revokedAt: null,
        accessCount: 5,
        lastAccessedAt: '2024-01-15T00:00:00Z',
        lastAccessedIp: '192.168.1.1',
        status: 'active' as const,
        createdBy: {
          id: 'user-1',
          email: 'test@example.com'
        }
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ links: testLinks })
    } as Response)

    render(
      <ShareLinkManager
        documentType="billing-statement"
        documentId="test-id"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Share Links (1)')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Views:')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('handles revoke link action', async () => {
    const mockFetch = fetch as any
    const testLinks = [
      {
        id: 'link-1',
        token: 'token-1',
        url: 'http://localhost:3001/billing-statement/share/token-1',
        documentType: 'BILLING_STATEMENT',
        documentId: 'test-id',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-02-01T00:00:00Z',
        isRevoked: false,
        revokedAt: null,
        accessCount: 5,
        lastAccessedAt: '2024-01-15T00:00:00Z',
        lastAccessedIp: '192.168.1.1',
        status: 'active' as const,
        createdBy: {
          id: 'user-1',
          email: 'test@example.com'
        }
      }
    ]

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ links: testLinks })
    } as Response)

    render(
      <ShareLinkManager
        documentType="billing-statement"
        documentId="test-id"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Revoke')).toBeInTheDocument()
    })

    // Click revoke button
    const revokeButton = screen.getByText('Revoke')
    fireEvent.click(revokeButton)

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Revoke Share Link')).toBeInTheDocument()
    })
  })
})