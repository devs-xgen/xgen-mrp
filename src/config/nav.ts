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
  UserSquare,
  Clock,
  AlertTriangle,
  Clipboard,
  Timer,
  Hammer,
  LineChart,
  QrCode,
  Receipt,
  FileText,
  TrendingUp,
  CreditCard,
} from "lucide-react";

interface NavItem {
  icon?: any;
  label: string;
  href?: string;
  description?: string;
  items?: NavItem[];
}

export const adminNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/admin/dashboard",
    description: "Overview of system metrics and activities",
  },
  {
    icon: Box,
    label: "Item Management",
    items: [
      {
        icon: Package,
        label: "Products",
        href: "/admin/products",
        description: "Manage product catalog",
      },
      {
        icon: Warehouse,
        label: "Materials",
        href: "/admin/materials",
        description: "Raw materials inventory management",
      },
    ],
  },
  {
    icon: Factory,
    label: "Production",
    items: [
      {
        label: "Production Orders",
        href: "/admin/production",
        description: "Production orders and scheduling",
      },
      {
        label: "Work Centers",
        href: "/admin/work-centers",
        description: "Manage work centers",
      },
    ],
  },
  //   {
  //   icon: Factory,
  //   label: "Production-History",
  //   items: [
  //     {
  //       label: "Production History Log",
  //       href: "/admin/production-history",
  //       description: "Production history and its log",
  //     }
  //   ],
  // },
  {
    icon: ShoppingCart,
    label: "Orders",
    items: [
      {
        label: "Purchase Orders",
        href: "/admin/purchase-orders",
        description: "Manage supplier orders",
      },
      {
        label: "Customer Orders",
        href: "/admin/customer-orders",
        description: "View and manage customer orders",
      },
    ],
  },
  {
    icon: CreditCard,
    label: "Billing",
    href: "/admin/billing",
    items: [
      {
        icon: FileText,
        label: "Billing Statements",
        href: "/admin/billing/billing-statements",
        description: "Manage customer billing statements",
      },
      {
        icon: Receipt,
        label: "Sales Invoices",
        href: "/admin/billing/sales-invoices",
        description: "Create and manage sales invoices",
      },
      {
        icon: Truck,
        label: "Delivery Receipts",
        href: "/admin/billing/delivery-receipts",
        description: "Track delivery confirmations",
      },
      {
        icon: TrendingUp,
        label: "Billing Reports",
        href: "/admin/billing/billing-reports",
        description: "Sales analytics and reports",
      },
    ],
  },
  {
    icon: Users,
    label: "Partners",
    items: [
      {
        icon: Truck,
        label: "Suppliers",
        href: "/admin/suppliers",
        description: "Supplier management",
      },
      {
        icon: Users,
        label: "Customers",
        href: "/admin/customers",
        description: "Customer management",
      },
      {
        icon: UserSquare,
        label: "Inspectors",
        href: "/admin/inspectors",
        description: "Worker management",
      },
    ],
  },
  {
    icon: Users,
    label: "Users",
    href: "/admin/users",
    description: "User management",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/admin/settings",
    description: "System configuration",
  },
];

export const workerNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/worker/dashboard",
    description: "Your work overview and daily tasks",
  },
  {
    icon: ClipboardList,
    label: "Tasks",
    items: [
      {
        icon: ClipboardList,
        label: "My Tasks",
        href: "/worker/tasks",
        description: "View and manage your assigned tasks",
      },
      {
        icon: Settings,
        label: "Task Operations",
        href: "/worker/tasks/operations",
        description: "Manage production order operations",
      },
    ],
  },
  {
    icon: QrCode,
    label: "QR Scanner",
    href: "/worker/qr-scanner",
    description: "Scan production QR codes to update status",
  },
  // {
  //   icon: Factory,
  //   label: 'Production',
  //   description: 'Production management',
  //   items: [
  //     {
  //       icon: Hammer,
  //       label: 'Operations',
  //       href: '/worker/production',
  //       description: 'Production operations and processes'
  //     },
  //     {
  //       icon: CheckSquare,
  //       label: 'Quality Control',
  //       href: '/worker/production/quality',
  //       description: 'Quality inspection tasks'
  //     },
  //     {
  //       icon: Boxes,
  //       label: 'Work in Progress',
  //       href: '/worker/production/wip',
  //       description: 'Track work in progress'
  //     },
  //     {
  //       icon: Timer,
  //       label: 'Time Tracking',
  //       href: '/worker/production/tracking',
  //       description: 'Track time spent on tasks'
  //     }
  //   ]
  // },
  {
    icon: Package,
    label: "Inventory",
    items: [
      {
        icon: Warehouse,
        label: "Materials",
        href: "/worker/inventory",
        description: "Check inventory levels",
      },
      {
        icon: AlertTriangle,
        label: "Low Stock Alerts",
        href: "/worker/inventory/alerts",
        description: "View materials requiring attention",
      },
    ],
  },
  // {
  //   icon: BadgeDollarSign,
  //   label: 'Orders',
  //   description: 'Orders management',
  //   items: [
  //     {
  //       icon: ShoppingCart,
  //       label: 'Customer Orders',
  //       href: '/worker/orders',
  //       description: 'View customer order requirements'
  //     },
  //     {
  //       icon: Truck,
  //       label: 'Shipments',
  //       href: '/worker/orders/shipments',
  //       description: 'Manage order shipments'
  //     }
  //   ]
  // },

  {
    icon: Settings,
    label: "Settings",
    href: "/worker/settings",
    description: "Account settings and preferences",
  },
];

export const inspectorNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/inspector/dashboard",
    description: "Your inspector overview",
  },
  {
    icon: ClipboardList, //check
    label: "Activity - log",
    href: "/inspector/activity-log",
    description: "View logs with and assigned tasks",
  },
  {
    icon: Factory,
    label: "Production",
    description: "Production Inspector",
    items: [
      {
        icon: ClipboardList, //check
        label: "Own Tasks",
        href: "/inspector/production",
        description: "View and manage production tasks",
      },
      {
        icon: QrCode,
        label: "QR Scanner",
        href: "/inspector/qr-scanner",
        description: "Scan production QR codes to update status",
      },
    ],
  },
  {
    icon: BadgeDollarSign,
    label: "Orders",
    description: "Orders management",
    items: [
      // {
      //   icon: ShoppingCart,
      //   label: 'Customer Orders',
      //   href: '/inspector/orders',
      //   description: 'View customer order requirements'
      // },
      {
        icon: Warehouse,
        label: "Materials",
        href: "/inspector/inventory",
        description: "Check inventory levels",
      },
      {
        icon: AlertTriangle,
        label: "Low Stock Alerts",
        href: "/inspector/inventory/alerts",
        description: "View materials requiring attention",
      },
    ],
  },

  {
    icon: Settings,
    label: "Settings",
    href: "/inspector/settings",
    description: "Account settings and preferences",
  },
];

export const deliveryNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/delivery/dashboard",
    description: "Delivery overview",
  },
  {
    icon: ClipboardList,
    label: "Tasks",
    href: "/delivery/tasks",
    description: "View and update delivery tasks",
  },
  {
    icon: ShoppingCart,
    label: "Orders",
    href: "/delivery/orders",
    description: "Delivery orders",
  },
  {
    icon: Truck,
    label: "Deliveries",
    href: "/delivery/deliveries",
    description: "Manage deliveries",
  },

  {
    icon: Settings,
    label: "Settings",
    href: "/delivery/settings",
    description: "Account settings",
  },
];

export const getNavItems = (role: string) => {
  switch (role) {
    case "ADMIN":
      return adminNavItems;
    case "WORKER":
      return workerNavItems;
    case "INSPECTOR":
      return inspectorNavItems;
    case "DELIVERY":
      return deliveryNavItems;
    default:
      return [];
  }
};
