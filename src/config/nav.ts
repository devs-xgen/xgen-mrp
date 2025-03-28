import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Settings,
  Warehouse,
  ShoppingCart,
  Factory,
  Truck,
  BadgeDollarSign,
  UserCircle,
  Box,
  Boxes,
  CheckSquare,
  UserSquare
} from 'lucide-react'

interface NavItem {
  icon?: any
  label: string
  href?: string
  description?: string
  items?: NavItem[]
}

export const adminNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/admin/dashboard',
    description: 'Overview of system metrics and activities'
  },
  {
    icon: Box,
    label: 'Item Management',
    items: [
      {
        icon: Package,
        label: 'Products',
        href: '/admin/products',
        description: 'Manage product catalog'
      },
      {
        icon: Warehouse,
        label: 'Materials',
        href: '/admin/materials',
        description: 'Raw materials inventory management'
      }
    ]
  },
  {
    icon: Factory,
    label: 'Production',
    items: [
      {
        label: 'Production Orders',
        href: '/admin/production',
        description: 'Production orders and scheduling'
      },
      {
        label: 'Work Centers',

        href: '/admin/work-centers',
        description: 'Manage work centers'
      }
    ]
  },
  {
    icon: ShoppingCart,
    label: 'Orders',
    items: [
      {
        label: 'Purchase Orders',
        href: '/admin/purchase-orders',
        description: 'Manage supplier orders'
      },
      {
        label: 'Customer Orders',
        href: '/admin/customer-orders',
        description: 'View and manage customer orders'
      }
    ]
  },
  {
    icon: Users,
    label: 'Partners',
    items: [
      {
        icon: Truck,
        label: 'Suppliers',
        href: '/admin/suppliers',
        description: 'Supplier management'
      },
      {
        icon: Users,
        label: 'Customers',
        href: '/admin/customers',
        description: 'Customer management'
      },
      {
        icon: UserSquare,
        label: 'Inspectors',
        href: '/admin/inspectors',
        description: 'Worker management'
      },
    ]
  },
  {
    icon: Users,
    label: 'Users',
    href: '/admin/users',
    description: 'User management'
  },
  {
    icon: Settings,
    label: 'Settings',
    href: '/admin/settings',
    description: 'System configuration'
  }
  // {
  //   icon: Text,
  //   label: 'Text',
  //   href: '/admin/text',
  //   description: 'text sample'
  // }
]

export const operatorNavItems = [
 {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/worker/dashboard',
    description: 'Your work overview'
  },
  {
    icon: Factory,
    label: 'Production',
    description: 'Production management',
    items: [
      {
        icon: ClipboardList,
        label: 'Tasks',
        href: '/worker/production',
        description: 'View and manage production tasks'
      },
      {
        icon: CheckSquare,
        label: 'Quality Control',
        href: '/worker/production/quality',
        description: 'Quality inspection tasks'
      },
      {
        icon: Boxes,
        label: 'Work in Progress',
        href: '/worker/production/wip',
        description: 'Track work in progress'
      }
    ]
  },
  {
    icon: Package,
    label: 'Inventory',
    href: '/worker/inventory',
    description: 'Check inventory levels'
  },
  {
    icon: BadgeDollarSign,
    label: 'Orders',
    description: 'Orders management',
    items: [
      {
        icon: ShoppingCart,
        label: 'Customer Orders',
        href: '/worker/orders',
        description: 'View customer order requirements'
      },
      {
        icon: Truck,
        label: 'Shipments',
        href: '/worker/orders/shipments',
        description: 'Manage order shipments'
      }
    ]
  },
  {
    icon: UserCircle,
    label: 'Profile',
    href: '/worker/profile',
    description: 'Manage your profile'
  },
  {
    icon: Settings,
    label: 'Settings',
    href: '/worker/settings',
    description: 'Account settings and preferences'
  }
]

export const getNavItems = (role: string) => {
  switch (role) {
    case 'ADMIN':
    case 'MANAGER':
      return adminNavItems
    case 'OPERATOR':
    case 'USER':
      return operatorNavItems
    default:
      return []
  }
}