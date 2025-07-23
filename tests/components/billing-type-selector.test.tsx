import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BillingTypeSelector } from '@/components/module/admin/billing/billing-type-selector'
import { BillingTypeId } from '@/types/admin/billing-types'
import { beforeEach } from 'node:test'

describe('BillingTypeSelector', () => {
  const mockOnTypeSelect = vi.fn()

  beforeEach(() => {
    mockOnTypeSelect.mockClear()
  })

  test('renders all billing type options', () => {
    render(
      <BillingTypeSelector
        onTypeSelect={mockOnTypeSelect}
      />
    )

    expect(screen.getByText('Customer Order Billing')).toBeInTheDocument()
    expect(screen.getByText('Direct Customer Billing')).toBeInTheDocument()
    expect(screen.getByText('Manual Customer Entry')).toBeInTheDocument()
  })

  test('displays correct descriptions for each billing type', () => {
    render(
      <BillingTypeSelector
        onTypeSelect={mockOnTypeSelect}
      />
    )

    expect(screen.getByText('Create billing from an existing customer order with pre-filled details')).toBeInTheDocument()
    expect(screen.getByText('Create billing for an existing customer from your database')).toBeInTheDocument()
    expect(screen.getByText('Create billing with manually entered customer information')).toBeInTheDocument()
  })

  test('shows recommended badge for customer order billing', () => {
    render(
      <BillingTypeSelector
        onTypeSelect={mockOnTypeSelect}
      />
    )

    expect(screen.getByText('Recommended')).toBeInTheDocument()
  })

  test('calls onTypeSelect when a billing type is clicked', () => {
    render(
      <BillingTypeSelector
        onTypeSelect={mockOnTypeSelect}
      />
    )

    const customerOrderCard = screen.getByText('Customer Order Billing').closest('[role="button"], div[class*="cursor-pointer"]')
    expect(customerOrderCard).toBeInTheDocument()
    
    if (customerOrderCard) {
      fireEvent.click(customerOrderCard)
      expect(mockOnTypeSelect).toHaveBeenCalledWith('customer-order')
    }
  })

  test('highlights selected billing type', () => {
    render(
      <BillingTypeSelector
        selectedType="direct-customer"
        onTypeSelect={mockOnTypeSelect}
      />
    )

    // Find the card container that has the border-primary class
    const cards = screen.getAllByText(/Billing/).map(text => {
      let element = text.closest('div')
      while (element && !element.classList.contains('border-primary') && !element.classList.contains('border-2')) {
        element = element.parentElement
      }
      return element
    })
    
    const selectedCard = cards.find(card => card?.classList.contains('border-primary'))
    expect(selectedCard).toBeTruthy()
  })

  test('shows selection summary when type is selected', () => {
    render(
      <BillingTypeSelector
        selectedType="manual-customer"
        onTypeSelect={mockOnTypeSelect}
      />
    )

    expect(screen.getByText('Selected: Manual Customer Entry')).toBeInTheDocument()
    // Use getAllByText since the description appears twice (in card and summary)
    const descriptions = screen.getAllByText('Create billing with manually entered customer information')
    expect(descriptions.length).toBeGreaterThan(0)
  })

  test('disables all cards when disabled prop is true', () => {
    render(
      <BillingTypeSelector
        disabled={true}
        onTypeSelect={mockOnTypeSelect}
      />
    )

    // Find the actual card containers that should have the disabled classes
    const cardContainers = screen.getAllByText(/Billing/).map(text => {
      let element = text.closest('div')
      // Find the card container (should have cursor-pointer class when not disabled)
      while (element && !element.classList.contains('cursor-pointer') && !element.classList.contains('cursor-not-allowed')) {
        element = element.parentElement
      }
      return element
    })
    
    cardContainers.forEach(card => {
      if (card) {
        expect(card).toHaveClass('opacity-50')
        expect(card).toHaveClass('cursor-not-allowed')
      }
    })
  })

  test('does not call onTypeSelect when disabled', () => {
    render(
      <BillingTypeSelector
        disabled={true}
        onTypeSelect={mockOnTypeSelect}
      />
    )

    const customerOrderCard = screen.getByText('Customer Order Billing').closest('div')
    if (customerOrderCard) {
      fireEvent.click(customerOrderCard)
      expect(mockOnTypeSelect).not.toHaveBeenCalled()
    }
  })

  test('applies custom className', () => {
    const { container } = render(
      <BillingTypeSelector
        className="custom-class"
        onTypeSelect={mockOnTypeSelect}
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('displays features for each billing type', () => {
    render(
      <BillingTypeSelector
        onTypeSelect={mockOnTypeSelect}
      />
    )

    // Customer Order features
    expect(screen.getByText('Auto-populated customer information')).toBeInTheDocument()
    expect(screen.getByText('Pre-filled order items and amounts')).toBeInTheDocument()
    
    // Direct Customer features
    expect(screen.getByText('Select from existing customers')).toBeInTheDocument()
    expect(screen.getByText('Access to customer payment terms')).toBeInTheDocument()
    
    // Manual Customer features
    expect(screen.getByText('Quick customer name entry')).toBeInTheDocument()
    expect(screen.getByText('No customer database required')).toBeInTheDocument()
  })

  test('renders icons for each billing type', () => {
    render(
      <BillingTypeSelector
        onTypeSelect={mockOnTypeSelect}
      />
    )

    expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument()
    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
  })
})