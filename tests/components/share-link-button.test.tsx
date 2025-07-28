import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareLinkButton } from '@/components/shared/ShareLinkButton'

// Mock fetch
global.fetch = vi.fn()

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn()
  }
})

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('ShareLinkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the share button', () => {
    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="bs-1"
      />
    )

    expect(screen.getByRole('button', { name: /generate shareable link/i })).toBeInTheDocument()
  })

  it('should show loading state when generating link', async () => {
    vi.mocked(fetch).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          shareableLink: {
            id: 'link-1',
            token: 'test-token',
            url: 'http://localhost:3001/billing-statement/share/test-token',
            expiresAt: new Date().toISOString()
          }
        })
      } as Response), 100))
    )

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="bs-1"
      />
    )

    const button = screen.getByRole('button', { name: /generate shareable link/i })
    fireEvent.click(button)

    expect(screen.getByTestId('loader2-icon')).toBeInTheDocument()
    expect(button).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByTestId('loader2-icon')).not.toBeInTheDocument()
    })
  })

  it('should generate and display shareable link', async () => {
    const mockResponse = {
      success: true,
      shareableLink: {
        id: 'link-1',
        token: 'test-token',
        url: 'http://localhost:3001/billing-statement/share/test-token',
        expiresAt: new Date().toISOString()
      }
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="bs-1"
      />
    )

    const button = screen.getByRole('button', { name: /generate shareable link/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockResponse.shareableLink.url)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
  })

  it('should copy link to clipboard when copy button is clicked', async () => {
    const mockResponse = {
      success: true,
      shareableLink: {
        id: 'link-1',
        token: 'test-token',
        url: 'http://localhost:3001/billing-statement/share/test-token',
        expiresAt: new Date().toISOString()
      }
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    const mockWriteText = vi.mocked(navigator.clipboard.writeText)
    mockWriteText.mockResolvedValue()

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="bs-1"
      />
    )

    // Generate link first
    const generateButton = screen.getByRole('button', { name: /generate shareable link/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    })

    // Copy link
    const copyButton = screen.getByRole('button', { name: /copy link/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(mockResponse.shareableLink.url)
    })
  })

  it('should handle API errors gracefully', async () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: mockToast
    })

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: 'Document not found'
      })
    } as Response)

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="non-existent"
      />
    )

    const button = screen.getByRole('button', { name: /generate shareable link/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Document not found',
        variant: 'destructive'
      })
    })
  })

  it('should handle network errors', async () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: mockToast
    })

    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="bs-1"
      />
    )

    const button = screen.getByRole('button', { name: /generate shareable link/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to generate shareable link',
        variant: 'destructive'
      })
    })
  })

  it('should call onLinkGenerated callback when provided', async () => {
    const mockOnLinkGenerated = vi.fn()
    const mockResponse = {
      success: true,
      shareableLink: {
        id: 'link-1',
        token: 'test-token',
        url: 'http://localhost:3001/billing-statement/share/test-token',
        expiresAt: new Date().toISOString()
      }
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="bs-1"
        onLinkGenerated={mockOnLinkGenerated}
      />
    )

    const button = screen.getByRole('button', { name: /generate shareable link/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnLinkGenerated).toHaveBeenCalledWith(mockResponse.shareableLink.url)
    })
  })

  it('should handle different document types correctly', async () => {
    const mockResponse = {
      success: true,
      shareableLink: {
        id: 'link-1',
        token: 'test-token',
        url: 'http://localhost:3001/sales-invoice/share/test-token',
        expiresAt: new Date().toISOString()
      }
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    render(
      <ShareLinkButton
        documentType="sales-invoice"
        documentId="si-1"
      />
    )

    const button = screen.getByRole('button', { name: /generate shareable link/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/share-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentType: 'SALES_INVOICE',
          documentId: 'si-1'
        })
      })
    })
  })

  it('should handle clipboard copy failures', async () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: mockToast
    })

    const mockResponse = {
      success: true,
      shareableLink: {
        id: 'link-1',
        token: 'test-token',
        url: 'http://localhost:3001/billing-statement/share/test-token',
        expiresAt: new Date().toISOString()
      }
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    const mockWriteText = vi.mocked(navigator.clipboard.writeText)
    mockWriteText.mockRejectedValue(new Error('Clipboard error'))

    render(
      <ShareLinkButton
        documentType="billing-statement"
        documentId="bs-1"
      />
    )

    // Generate link first
    const generateButton = screen.getByRole('button', { name: /generate shareable link/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    })

    // Try to copy link
    const copyButton = screen.getByRole('button', { name: /copy link/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive'
      })
    })
  })
})