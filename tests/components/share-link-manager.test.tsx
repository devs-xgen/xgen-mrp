import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareLinkManager } from '@/components/shared/ShareLinkManager'

// Mock fetch
global.fetch = vi.fn()

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

const mockLinks = [
  {
    id: 'link-1',
    token: 'token-1',
    documentType: 'BILLING_STATEMENT',
    documentId: 'bs-1',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    expiresAt: new Date('2024-02-15T10:00:00Z'),
    isRevoked: false,
    accessCount: 5,
    lastAccessedAt: new Date('2024-01-20T15:30:00Z'),
    createdByUser: {
      name: 'John Admin',
      email: 'john@example.com'
    }
  },
  {
    id: 'link-2',
    token: 'token-2',
    documentType: 'BILLING_STATEMENT',
    documentId: 'bs-1',
    createdAt: new Date('2024-01-10T09:00:00Z'),
    expiresAt: new Date('2024-01-12T09:00:00Z'), // Expired
    isRevoked: false,
    accessCount: 2,
    lastAccessedAt: new Date('2024-01-11T12:00:00Z'),
    createdByUser: {
      name: 'Jane Admin',
      email: 'jane@example.com'
    }
  },
  {
    id: 'link-3',
    token: 'token-3',
    documentType: 'BILLING_STATEMENT',
    documentId: 'bs-1',
    createdAt: new Date('2024-01-05T14:00:00Z'),
    expiresAt: new Date('2024-02-05T14:00:00Z'),
    isRevoked: true,
    revokedAt: new Date('2024-01-08T16:00:00Z'),
    accessCount: 1,
    createdByUser: {
      name: 'Bob Admin',
      email: 'bob@example.com'
    }
  }
]

describe('ShareLinkManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render existing share links', () => {
    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={vi.fn()}
      />
    )

    expect(screen.getByText('Existing Share Links')).toBeInTheDocument()
    expect(screen.getByText('token-1')).toBeInTheDocument()
    expect(screen.getByText('token-2')).toBeInTheDocument()
    expect(screen.getByText('token-3')).toBeInTheDocument()
  })

  it('should display link status correctly', () => {
    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={vi.fn()}
      />
    )

    // Active link
    expect(screen.getByText('Active')).toBeInTheDocument()
    
    // Expired link
    expect(screen.getByText('Expired')).toBeInTheDocument()
    
    // Revoked link
    expect(screen.getByText('Revoked')).toBeInTheDocument()
  })

  it('should display access count and last accessed date', () => {
    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={vi.fn()}
      />
    )

    expect(screen.getByText('5 accesses')).toBeInTheDocument()
    expect(screen.getByText('2 accesses')).toBeInTheDocument()
    expect(screen.getByText('1 access')).toBeInTheDocument()
  })

  it('should show revoke button only for active links', () => {
    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={vi.fn()}
      />
    )

    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i })
    // Only active and expired (but not revoked) links should have revoke buttons
    expect(revokeButtons).toHaveLength(2)
  })

  it('should handle link revocation', async () => {
    const mockOnLinksUpdate = vi.fn()
    const mockToast = vi.fn()
    
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: mockToast
    })

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: 'Share link revoked successfully'
      })
    } as Response)

    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={mockOnLinksUpdate}
      />
    )

    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i })
    fireEvent.click(revokeButtons[0])

    // Confirm revocation in dialog
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to revoke this link?')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/share-links/link-1', {
        method: 'DELETE'
      })
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Share link revoked successfully'
    })

    expect(mockOnLinksUpdate).toHaveBeenCalled()
  })

  it('should handle revocation errors', async () => {
    const mockToast = vi.fn()
    
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: mockToast
    })

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: 'Share link not found'
      })
    } as Response)

    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={vi.fn()}
      />
    )

    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i })
    fireEvent.click(revokeButtons[0])

    // Confirm revocation in dialog
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to revoke this link?')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Share link not found',
        variant: 'destructive'
      })
    })
  })

  it('should show empty state when no links exist', () => {
    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={[]}
        onLinksUpdate={vi.fn()}
      />
    )

    expect(screen.getByText('No shareable links created yet')).toBeInTheDocument()
  })

  it('should display creation date and expiration date', () => {
    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={vi.fn()}
      />
    )

    // Check for formatted dates (exact format may vary based on locale)
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    expect(screen.getByText(/Feb 15, 2024/)).toBeInTheDocument()
  })

  it('should show loading state during revocation', async () => {
    vi.mocked(fetch).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Share link revoked successfully'
        })
      } as Response), 100))
    )

    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={vi.fn()}
      />
    )

    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i })
    fireEvent.click(revokeButtons[0])

    // Confirm revocation in dialog
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to revoke this link?')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)

    // Should show loading state
    expect(screen.getByTestId('loader2-icon')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByTestId('loader2-icon')).not.toBeInTheDocument()
    })
  })

  it('should handle network errors during revocation', async () => {
    const mockToast = vi.fn()
    
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: mockToast
    })

    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={vi.fn()}
      />
    )

    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i })
    fireEvent.click(revokeButtons[0])

    // Confirm revocation in dialog
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to revoke this link?')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to revoke share link',
        variant: 'destructive'
      })
    })
  })

  it('should display creator information', () => {
    render(
      <ShareLinkManager
        documentType="BILLING_STATEMENT"
        documentId="bs-1"
        existingLinks={mockLinks}
        onLinksUpdate={vi.fn()}
      />
    )

    expect(screen.getByText('John Admin')).toBeInTheDocument()
    expect(screen.getByText('Jane Admin')).toBeInTheDocument()
    expect(screen.getByText('Bob Admin')).toBeInTheDocument()
  })
})