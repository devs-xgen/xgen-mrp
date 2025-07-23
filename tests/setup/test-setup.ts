import { vi } from 'vitest'
import '@testing-library/jest-dom'
import React from 'react'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => React.createElement('img', { src, alt, ...props }),
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ShoppingCart: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'shopping-cart-icon', className, ...props }),
  Users: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'users-icon', className, ...props }),
  Edit: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'edit-icon', className, ...props }),
  Check: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'check-icon', className, ...props }),
  Star: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'star-icon', className, ...props }),
  Search: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'search-icon', className, ...props }),
  X: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'x-icon', className, ...props }),
  Calendar: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'calendar-icon', className, ...props }),
  DollarSign: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'dollar-sign-icon', className, ...props }),
  User: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'user-icon', className, ...props }),
  Mail: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'mail-icon', className, ...props }),
  Phone: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'phone-icon', className, ...props }),
  MapPin: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'map-pin-icon', className, ...props }),
  CreditCard: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'credit-card-icon', className, ...props }),
  ChevronDown: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'chevron-down-icon', className, ...props }),
  ChevronRight: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'chevron-right-icon', className, ...props }),
  Info: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'info-icon', className, ...props }),
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))