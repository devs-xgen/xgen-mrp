# Unified Layout System

## Overview

The XGEN-MRP system now uses a unified layout approach across all role-based portals (Admin, Worker, Inspector, Delivery) to ensure consistency and maintainability.

## Components

### 1. UnifiedLayout (`src/components/shared/UnifiedLayout.tsx`)
- **Purpose**: Centralized layout component that handles authentication and role-based access control
- **Features**:
  - Server-side authentication check
  - Role-based access control with configurable allowed roles
  - Automatic redirection for unauthorized users
  - Consistent theme provider and toaster integration

### 2. LayoutWithTheme (`src/components/shared/LayoutWithTheme.tsx`)
- **Purpose**: Client-side layout wrapper that provides the main layout structure
- **Features**:
  - Fixed sidebar that doesn't scroll with content
  - Responsive main content area
  - Proper overflow handling
  - Theme integration

### 3. AppSidebar (`src/components/shared/AppSidebar.tsx`)
- **Purpose**: Role-based navigation sidebar
- **Features**:
  - Collapsible sidebar
  - Role-specific navigation items
  - Theme toggle
  - User profile display
  - Smooth animations

## Layout Structure

```
layout-container (flex, h-screen, overflow-hidden)
├── sidebar-container (fixed width, full height)
│   └── AppSidebar
│       ├── Header (user info, controls)
│       ├── Navigation (scrollable)
│       └── Footer (logout, user details)
└── main-content-container (flexible, full height)
    └── main (scrollable content area)
        └── content padding wrapper
            └── page content
```

## Key Features

### Fixed Sidebar
- The sidebar is fixed and never scrolls with the page content
- Uses `flex-shrink-0` to prevent shrinking
- Maintains consistent width when collapsed/expanded

### Scrollable Content
- Only the main content area scrolls
- Sidebar header and footer remain fixed
- Navigation section in sidebar has independent scrolling if needed

### Responsive Design
- Uses CSS classes for consistent behavior
- Supports mobile viewport height (`100dvh`)
- Proper overflow handling prevents layout issues

## Usage in Role Layouts

Each role's protected layout file now simply uses the UnifiedLayout:

```tsx
import UnifiedLayout from "@/components/shared/UnifiedLayout";

export default async function RoleProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedLayout
      allowedRoles={["ROLE_NAME"]}
      fallbackRoute="/fallback/route"
      loginRoute="/role/login"
    >
      {children}
    </UnifiedLayout>
  );
}
```

## CSS Classes

### Custom Layout Classes
- `.layout-container`: Main layout container
- `.sidebar-container`: Sidebar wrapper
- `.main-content-container`: Main content wrapper

### Utilities
- Enhanced scrollbar styling
- Proper height handling with `100dvh`
- Overflow control for layout stability

## Benefits

1. **Consistency**: All portals use the same layout structure
2. **Maintainability**: Single source of truth for layout logic
3. **Performance**: Optimized scrolling and rendering
4. **Accessibility**: Proper focus management and keyboard navigation
5. **Responsive**: Works across different screen sizes
6. **Theme Support**: Integrated dark/light theme switching

## Troubleshooting

### Sidebar Scrolling Issues
- Ensure `overflow-hidden` is applied to parent containers
- Check that `height: 100%` is properly inherited
- Verify CSS custom classes are loaded

### Content Not Scrolling
- Main content should have `overflow-y-auto`
- Content wrapper needs `min-h-full` for proper scrolling
- Check for conflicting height/overflow styles

### Theme Issues
- Verify ThemeProvider is properly wrapping the layout
- Check theme context is available in child components
- Ensure CSS variables are defined for both light/dark themes 