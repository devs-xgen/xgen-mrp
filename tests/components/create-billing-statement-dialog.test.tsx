import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/actions/enhanced-billing-statements', () => ({
  createEnhancedBillingStatement: vi.fn(),
}))

import { createEnhancedBillingStatement } from '@/lib/actions/enhanced-billing-statements'
import { CreateBillingStatementDialog } from '@/components/module/admin/customer-orders/create-billing-statement-dialog'

const mockOrder = {
  id: 'co_123',
  orderNumber: 'CO-0001',
  customerName: 'Acme Corp',
  totalAmount: 1234.56,
}

describe('CreateBillingStatementDialog', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits with delivery receipt by default', async () => {
    ;(createEnhancedBillingStatement as any).mockResolvedValueOnce({ success: true })
    const onOpenChange = vi.fn()

    render(
      <CreateBillingStatementDialog
        customerOrder={mockOrder}
        open={true}
        onOpenChange={onOpenChange}
      />
    )

    const submit = await screen.findByRole('button', { name: /create all documents/i })
    await user.click(submit)

    expect(createEnhancedBillingStatement).toHaveBeenCalledTimes(1)
    expect(createEnhancedBillingStatement).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'customer_order',
        customerOrderId: mockOrder.id,
        status: 'DRAFT',
        totalAmount: mockOrder.totalAmount,
        createDeliveryReceipt: true,
        billingDate: expect.any(Date),
        dueDate: expect.any(Date),
      })
    )

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('submits without delivery receipt when unchecked', async () => {
    ;(createEnhancedBillingStatement as any).mockResolvedValueOnce({ success: true })
    const onOpenChange = vi.fn()

    render(
      <CreateBillingStatementDialog
        customerOrder={mockOrder}
        open={true}
        onOpenChange={onOpenChange}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    const submit = screen.getByRole('button', { name: /create billing statement/i })
    await user.click(submit)

    expect(createEnhancedBillingStatement).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'customer_order',
        customerOrderId: mockOrder.id,
        createDeliveryReceipt: false,
      })
    )

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows error state and keeps dialog open when server action fails', async () => {
    ;(createEnhancedBillingStatement as any).mockRejectedValueOnce(new Error('boom'))
    const onOpenChange = vi.fn()

    render(
      <CreateBillingStatementDialog
        customerOrder={mockOrder}
        open={true}
        onOpenChange={onOpenChange}
      />
    )

    const submit = await screen.findByRole('button', { name: /create all documents/i })
    await user.click(submit)

    expect(createEnhancedBillingStatement).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()

    // Dialog content should still be visible
    expect(screen.getByText(/create billing statement/i)).toBeInTheDocument()
  })
})
