import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BillingTypeCard } from '@/components/module/admin/billing/billing-type-card'
import { BillingTypeOption } from '@/types/admin/billing-types'
import { ShoppingCart } from 'lucide-react'

const mockOption: BillingTypeOption = {
  id: 'customer-order',
  title: 'Customer Order Billing',
  description: 'Create billing from an existing customer order with pre-filled details',
  icon: ShoppingCart,
  recommended: true,
  features: [
    'Auto-populated customer information',
    'Pre-filled order items and amounts',
    'Order reference tracking',
    'Streamlined workflow'
  ]
}

describe('BillingTypeCard', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  test('renders billing type information correctly', () => {
    render(
      <BillingTypeCard
        option={mockOption}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('Customer Order Billing')).toBeInTheDocument()
    expect(screen.getByText('Create billing from an existing customer order with pre-filled details')).toBeInTheDocument()
  })

  test('displays all features', () => {
    render(
      <BillingTypeCard
        option={mockOption}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    mockOption.features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  test('shows recommended badge when option is recommended', () => {
    render(
      <BillingTypeCard
        option={mockOption}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('Recommended')).toBeInTheDocument()
    expect(screen.getByTestId('star-icon')).toBeInTheDocument()
  })

  test('does not show recommended badge when option is not recommended', () => {
    const nonRecommendedOption = { ...mockOption, recommended: false }
    
    render(
      <BillingTypeCard
        option={nonRecommendedOption}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.queryByText('Recommended')).not.toBeInTheDocument()
  })

  test('shows selection indicator when selected', () => {
    render(
      <BillingTypeCard
        option={mockOption}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByTestId('check-icon')).toBeInTheDocument()
  })

  test('applies selected styles when selected', () => {
    const { container } = render(
      <BillingTypeCard
        option={mockOption}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('border-primary')
    expect(card).toHaveClass('bg-primary/5')
  })

  test('applies hover styles when not disabled', () => {
    const { container } = render(
      <BillingTypeCard
        option={mockOption}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('hover:shadow-md')
    expect(card).toHaveClass('hover:border-primary/20')
    expect(card).toHaveClass('hover:scale-[1.02]')
  })

  test('calls onSelect when clicked', () => {
    const { container } = render(
      <BillingTypeCard
        option={mockOption}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    const card = container.firstChild as HTMLElement
    fireEvent.click(card)
    
    expect(mockOnSelect).toHaveBeenCalledWith('customer-order')
  })

  test('does not call onSelect when disabled', () => {
    const { container } = render(
      <BillingTypeCard
        option={mockOption}
        isSelected={false}
        onSelect={mockOnSelect}
        disabled={true}
      />
    )

    const card = container.firstChild as HTMLElement
    fireEvent.click(card)
    
    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  test('applies disabled styles when disabled', () => {
    const { container } = render(
      <BillingTypeCard
        option={mockOption}
        isSelected={false}
        onSelect={mockOnSelect}
        disabled={true}
      />
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('opacity-50')
    expect(card).toHaveClass('cursor-not-allowed')
  })

  test('renders icon component', () => {
    render(
      <BillingTypeCard
        option={mockOption}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument()
  })

  test('changes icon color when selected', () => {
    render(
      <BillingTypeCard
        option={mockOption}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    )

    const iconContainer = screen.getByTestId('shopping-cart-icon').parentElement
    expect(iconContainer).toHaveClass('bg-primary')
    expect(iconContainer).toHaveClass('text-primary-foreground')
  })

  test('changes title color when selected', () => {
    render(
      <BillingTypeCard
        option={mockOption}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    )

    const title = screen.getByText('Customer Order Billing')
    expect(title).toHaveClass('text-primary')
  })

  test('changes feature bullet color when selected', () => {
    const { container } = render(
      <BillingTypeCard
        option={mockOption}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    )

    const bullets = container.querySelectorAll('.w-1\\.5')
    bullets.forEach(bullet => {
      expect(bullet).toHaveClass('bg-primary')
    })
  })
})