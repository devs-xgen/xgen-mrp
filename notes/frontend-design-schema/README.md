# XGen MRP Frontend Design Schema

**Purpose:** Complete guide to building consistent, professional UI components for the XGen MRP system  
**Audience:** Frontend developers, UI/UX designers, and component creators  
**Last Updated:** January 20, 2025

This document provides comprehensive guidance on creating consistent, professional UI components using our enhanced design system with shadcn/ui components and Tailwind CSS custom properties.

## Overview

The Frontend Design Schema is a comprehensive reference for building UI components with consistent design patterns, styling, and behavior. It captures the design patterns, components, and styling principles from existing components like `AddMaterialDialog`, `analytics-card`, and `create-dialog`.

**Key Philosophy**: Enhanced color system using Tailwind CSS custom properties to automatically apply subtle backgrounds throughout the application. Standard classes like `bg-white` now use `#F2F3F4` instead of pure white, providing a sophisticated, modern look while maintaining excellent readability.

## Enhanced Color System

### Automatic Color Application

The system now uses **CSS custom properties** that are automatically applied through standard Tailwind classes. This means:

- `bg-white` → Automatically uses `#F2F3F4` (subtle shade)
- `bg-card` → Uses the same `#F2F3F4` for consistency  
- `bg-secondary` → Uses `#F8F9FA` (lighter shade)
- `bg-muted` → Uses `#FAFBFC` (accent shade)
- `bg-popover` → Uses pure white for elevated elements

### Standard Tailwind Classes

Use these standard classes throughout your application:

```tsx
// Card backgrounds - automatically subtle
<Card className="bg-card border rounded-lg">

// Dialog backgrounds - automatically enhanced
<DialogContent className="bg-popover">
<div className="bg-muted"> // Dialog body with accent background

// Layout backgrounds
<div className="bg-background"> // Main application background
<main className="bg-muted/30"> // Content area with subtle accent
```

### When to Use Custom Colors

Only use specific hex colors or custom classes for:
- **Status indicators** (colored backgrounds for metrics)
- **Brand-specific elements** 
- **Special highlighting** that needs specific colors

```tsx
// For colored metrics/status
<div className="bg-blue-50/90 border border-blue-200/70"> // Status: Info
<div className="bg-green-50/90 border border-green-200/70"> // Status: Success  
<div className="bg-red-50/90 border border-red-200/70"> // Status: Error
```

## How to Use This Schema

### For New Components

When creating a new component:

1. **Use standard classes first**: `bg-card`, `bg-muted`, `bg-popover`, etc.
2. **Review the schema**: Check if there's an existing pattern that matches your needs
3. **Follow established patterns**: Use the same structure and component organization
4. **Maintain consistency**: The automatic color system ensures visual consistency
5. **Reference example implementations**: Use the code snippets as starting points

### For Existing Components

When modifying existing components:

1. **Simplify color usage**: Replace `bg-[#F2F3F4]` with `bg-card` or `bg-white`
2. **Use semantic classes**: Choose `bg-muted`, `bg-secondary` based on content hierarchy
3. **Ensure consistency**: Let the automatic system handle the visual styling
4. **Update the schema if needed**: If you create a new pattern, update the schema

## Key Design Patterns

### Table Page Layouts

The schema includes three main table page layout patterns:

1. **Standard Table Page**: Basic layout with page header, table toolbar, and data table
2. **Table Page with Summary Cards**: Includes analytics cards above the table for key metrics
3. **Table Page with Sidebar**: Features a sidebar for advanced filtering alongside the main table

**Standard Table Page Implementation:**

```jsx
<div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
  {/* Page Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Products</h1>
      <p className="text-muted-foreground mt-1">Manage your product catalog</p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
      <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
    </div>
  </div>

  {/* Table Container */}
  <div className="bg-card border rounded-lg">
    {/* Table Toolbar */}
    <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4 border-b bg-card">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-10" />
        </div>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />Filters
        </Button>
      </div>
    </div>

    {/* Table */}
    <div className="overflow-auto">
      <table className="w-full">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="p-4 text-left font-medium">Product</th>
            <th className="p-4 text-left font-medium">Category</th>
            <th className="p-4 text-left font-medium">Stock</th>
            <th className="p-4 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b hover:bg-muted/30 transition-colors">
            <td className="p-4 align-middle">Product Name</td>
            <td className="p-4 align-middle">Category</td>
            <td className="p-4 align-middle">
              <Badge variant="outline">In Stock</Badge>
            </td>
            <td className="p-4 align-middle">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="p-4 border-t bg-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing 1 to 10 of 100 results</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  </div>
</div>
```

All table layouts use the enhanced color scheme automatically through the CSS custom properties system.

### Two-Panel Layout

**Simplified Implementation:**

```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full bg-muted">
  {/* Left Panel */}
  <Card className="flex-1 flex flex-col min-h-0 bg-card border">
    <CardHeader className="pb-3 flex-shrink-0 bg-secondary border-b">
      <CardTitle>Available Items</CardTitle>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-10" />
      </div>
    </CardHeader>
    <CardContent className="flex-1 p-0 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2">
          {/* Items go here */}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
  
  {/* Right Panel */}
  <Card className="flex-1 flex flex-col min-h-0 bg-card border">
    <CardHeader className="pb-3 flex-shrink-0 bg-secondary border-b">
      <CardTitle>Selected Items</CardTitle>
    </CardHeader>
    <CardContent className="flex-1 p-0 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2">
          {/* Selected items go here */}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
</div>
```

### Analytics Cards

**Standard Implementation:**

```jsx
// Standard analytics card
<div className="relative rounded-lg bg-card border p-6 transition-all duration-200 hover:shadow-sm">
  <div className="flex items-center space-x-4">
    <ShoppingCart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
    <div>
      <p className="text-sm font-medium text-muted-foreground truncate">Total Orders</p>
      <p className="text-2xl font-bold text-foreground mt-1 sm:text-3xl">{totalOrders}</p>
      <p className="text-xs text-muted-foreground mt-1 truncate">Last 30 days</p>
    </div>
  </div>
</div>

// Elevated analytics card
<div className="relative rounded-lg bg-popover border p-6 transition-all duration-200 shadow-sm hover:shadow-md">
  {/* Same content structure */}
</div>

// Colored analytics card for important metrics  
<div className="relative rounded-lg bg-blue-50/90 border border-blue-200/70 dark:bg-blue-950/30 dark:border-blue-800/50 p-6 transition-all duration-200">
  {/* Content for status-specific metrics */}
</div>
```

### Dialog Layout

**Simplified with automatic styling:**

```jsx
<DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 bg-popover">
  <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-popover">
    <div className="flex items-center justify-between">
      <DialogTitle>Dialog Title</DialogTitle>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit}>Submit</Button>
      </div>
    </div>
  </DialogHeader>
  
  <div className="flex-1 overflow-auto bg-muted">
    {/* Dialog content goes here */}
  </div>
  
  <div className="border-t p-4 flex-shrink-0 bg-popover">
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit}>Submit</Button>
    </div>
  </div>
</DialogContent>
```

## Benefits of the Enhanced System

1. **Consistency**: All components automatically use the same color scheme
2. **Maintainability**: Changes to the color system only require CSS updates
3. **Simplicity**: Use standard Tailwind classes instead of custom hex values
4. **Flexibility**: Easy to adjust the entire application's color scheme
5. **Performance**: CSS custom properties are more efficient than inline styles

## Migration Notes

When updating existing components:

- Replace `bg-[#F2F3F4]` with `bg-card` or `bg-white`
- Replace `bg-[#F8F9FA]` with `bg-secondary`  
- Replace `bg-[#FAFBFC]` with `bg-muted`
- Use `bg-popover` for elevated/modal elements
- Keep colored backgrounds for status indicators

## Status and Badge Styling

Use consistent styling for status badges:

```jsx
// Stock status
{stockStatus === "normal" && <Badge variant="outline">In Stock</Badge>}
{stockStatus === "low" && <Badge variant="secondary" className="bg-blue-500 text-white">Low Stock</Badge>}
{stockStatus === "out" && <Badge variant="destructive">Out of Stock</Badge>}

// Status badges
{status === "ACTIVE" && <Badge variant="default" className="bg-green-500 text-white">Active</Badge>}
{status === "PENDING" && <Badge variant="outline" className="bg-yellow-500 text-white">Pending</Badge>}
{status === "COMPLETED" && <Badge variant="default" className="bg-green-500 text-white">Completed</Badge>}
{status === "CANCELLED" && <Badge variant="destructive">Cancelled</Badge>}
```

## Responsive Design

Always implement responsive design:

- Use mobile-first approach
- Stack multi-column layouts on mobile
- Hide non-essential UI on small screens
- Provide alternative UI for mobile when needed

```jsx
// Hide on mobile, show on larger screens
<div className="hidden sm:flex">Desktop only content</div>

// Show only on mobile
<div className="sm:hidden">Mobile only content</div>

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

## Data Loading States

Implement consistent loading, error, and empty states:

```jsx
// Loading state
{loading && (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Loading...</span>
  </div>
)}

// Error state
{error && (
  <div className="text-center py-12">
    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium mb-2">Error</h3>
    <p className="text-muted-foreground">{errorMessage}</p>
  </div>
)}

// Empty state
{items.length === 0 && (
  <div className="text-center py-12">
    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium mb-2">No Items</h3>
    <p className="text-muted-foreground">No items found</p>
  </div>
)}
```

## 🧩 shadcn/ui Component Integration

### Installing shadcn/ui Components

Our system is built on top of shadcn/ui components. Here's how to add new components:

#### **Basic Installation Commands**
```bash
# Core UI components (already installed)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add table

# Form components
npx shadcn-ui@latest add form
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover

# Advanced components
npx shadcn-ui@latest add data-table
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion
```

#### **Component Customization**
After installing, components are located in `src/components/ui/`. You can customize them while maintaining consistency:

```tsx
// Example: Customizing Button component
// File: src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### **Component Usage Standards**

#### **Button Components**
```tsx
// Primary actions
<Button>Primary Action</Button>
<Button size="sm">Small Button</Button>
<Button size="lg">Large Button</Button>

// Secondary actions
<Button variant="outline">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>

// Destructive actions
<Button variant="destructive">Delete</Button>

// With icons
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Add Item
</Button>

// Icon only
<Button size="icon" variant="ghost">
  <MoreHorizontal className="w-4 h-4" />
</Button>
```

#### **Form Components**
```tsx
// Standard form field
<div className="space-y-2">
  <Label htmlFor="name">Name *</Label>
  <Input 
    id="name" 
    placeholder="Enter name..."
    {...register("name", { required: "Name is required" })}
  />
  {errors.name && (
    <p className="text-sm text-destructive">{errors.name.message}</p>
  )}
</div>

// Select field
<div className="space-y-2">
  <Label htmlFor="category">Category</Label>
  <Select onValueChange={setValue}>
    <SelectTrigger>
      <SelectValue placeholder="Select category..." />
    </SelectTrigger>
    <SelectContent>
      {categories.map(cat => (
        <SelectItem key={cat.id} value={cat.id}>
          {cat.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

// Textarea
<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea 
    id="description"
    placeholder="Enter description..."
    rows={4}
  />
</div>
```

#### **Card Components**
```tsx
// Standard card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Flex card for scrollable content
<Card className="flex flex-col h-full">
  <CardHeader className="flex-shrink-0">
    <CardTitle>Scrollable Card</CardTitle>
  </CardHeader>
  <CardContent className="flex-1 overflow-auto">
    <ScrollArea className="h-full">
      {/* Scrollable content */}
    </ScrollArea>
  </CardContent>
</Card>
```

#### **Dialog Components**
```tsx
// Standard dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description explaining the purpose
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Dialog content */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Submit
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Full-screen dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
    <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
      {/* Header content */}
    </DialogHeader>
    <div className="flex-1 overflow-auto p-6">
      {/* Main content */}
    </div>
    <div className="border-t p-4 flex-shrink-0">
      {/* Footer actions */}
    </div>
  </DialogContent>
</Dialog>
```

## 🎨 Component Creation Guidelines

### **Creating New Components**

When creating new components, follow this structure:

```tsx
// File: src/components/module/[role]/[feature]/ComponentName.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Icon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ComponentNameProps {
  // Define your props with proper TypeScript types
  data: DataType[]
  onAction: (item: DataType) => void
  loading?: boolean
}

export function ComponentName({ 
  data, 
  onAction, 
  loading = false 
}: ComponentNameProps) {
  const [localState, setLocalState] = useState<StateType>()
  const { toast } = useToast()

  const handleAction = async (item: DataType) => {
    try {
      await onAction(item)
      toast({
        title: "Success",
        description: "Action completed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Action failed",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          Component Title
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((item) => (
              <div
                key={item.id}
                className="bg-secondary border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="outline">{item.status}</Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAction(item)}
                    >
                      Action
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### **Component File Organization**

```
src/components/
├── ui/                     # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── module/                 # Feature-specific components
│   ├── admin/
│   │   ├── production/
│   │   │   ├── ProductionOrderDialog.tsx
│   │   │   ├── ProductionOrderTable.tsx
│   │   │   └── ProductionOrderCard.tsx
│   │   ├── materials/
│   │   └── customers/
│   ├── worker/
│   ├── inspector/
│   └── delivery/
├── shared/                 # Cross-role business components
│   ├── DataTable.tsx
│   ├── SearchInput.tsx
│   └── StatusBadge.tsx
└── common/                 # Generic utility components
    ├── LoadingSpinner.tsx
    ├── EmptyState.tsx
    └── ErrorBoundary.tsx
```

## 🎯 Consistency Standards

### **Color Usage Standards**

```tsx
// ✅ DO: Use semantic color classes
<div className="bg-card border">           // Standard card background
<div className="bg-secondary">             // Nested content background
<div className="bg-muted">                 // Highlighted content background
<div className="bg-popover">               // Elevated/modal background

// ✅ DO: Use status-specific colors for badges and indicators
<Badge className="bg-green-500 text-white">Active</Badge>
<Badge className="bg-yellow-500 text-white">Pending</Badge>
<Badge variant="destructive">Error</Badge>

// ❌ DON'T: Use arbitrary hex colors
<div className="bg-[#F2F3F4]">            // Use bg-card instead
<div className="bg-[#F8F9FA]">            // Use bg-secondary instead
```

### **Spacing Standards**

```tsx
// ✅ DO: Use consistent spacing scale
<div className="space-y-2">               // Tight spacing within components
<div className="space-y-4">               // Standard component spacing
<div className="space-y-6">               // Section spacing
<div className="gap-4">                   // Grid/flex gaps
<div className="p-4">                     // Standard padding
<div className="p-6">                     // Large padding for cards

// ❌ DON'T: Use arbitrary spacing values
<div className="space-y-3">               // Use space-y-2 or space-y-4
<div className="p-5">                     // Use p-4 or p-6
```

### **Typography Standards**

```tsx
// ✅ DO: Use consistent typography scale
<h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
<h2 className="text-2xl font-semibold">Section Title</h2>
<h3 className="text-lg font-medium">Card Title</h3>
<p className="text-sm text-muted-foreground">Description text</p>
<p className="text-xs text-muted-foreground">Helper text</p>

// ❌ DON'T: Use arbitrary font sizes
<h1 className="text-4xl">                // Use text-3xl for page titles
<p className="text-base">                 // Use text-sm for body text
```

### **Icon Usage Standards**

```tsx
// ✅ DO: Use consistent icon sizes and positioning
<Button>
  <Plus className="w-4 h-4 mr-2" />      // Standard button icon
  Add Item
</Button>

<div className="flex items-center gap-2">
  <Icon className="w-5 h-5" />           // Card/section header icon
  <span>Title</span>
</div>

<Icon className="w-8 h-8" />             // Analytics card icon
<Icon className="w-12 h-12" />           // Empty state icon

// ❌ DON'T: Use inconsistent icon sizes
<Plus className="w-3 h-3" />             // Too small for buttons
<Icon className="w-6 h-6" />             // Non-standard size
```

## 🧪 Testing Components

### **Component Testing Standards**

```tsx
// File: src/components/module/admin/ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  const mockProps = {
    data: [
      { id: '1', name: 'Test Item', description: 'Test Description', status: 'active' }
    ],
    onAction: jest.fn(),
    loading: false
  }

  it('renders component correctly', () => {
    render(<ComponentName {...mockProps} />)
    expect(screen.getByText('Test Item')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<ComponentName {...mockProps} loading={true} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<ComponentName {...mockProps} data={[]} />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('handles action clicks', () => {
    render(<ComponentName {...mockProps} />)
    fireEvent.click(screen.getByText('Action'))
    expect(mockProps.onAction).toHaveBeenCalledWith(mockProps.data[0])
  })
})
```

## 📱 Mobile Responsiveness

### **Mobile-First Approach**

```tsx
// ✅ DO: Design mobile-first, enhance for desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<div className="flex flex-col sm:flex-row gap-4">
<div className="hidden sm:block">Desktop only content</div>
<div className="sm:hidden">Mobile only content</div>

// ✅ DO: Use responsive text sizes
<h1 className="text-2xl sm:text-3xl font-bold">Responsive Title</h1>
<p className="text-sm sm:text-base">Responsive text</p>

// ✅ DO: Stack complex layouts on mobile
<div className="flex flex-col lg:flex-row gap-6">
  <div className="lg:w-1/3">Sidebar</div>
  <div className="lg:w-2/3">Main content</div>
</div>
```

## 🔄 Component Lifecycle

### **State Management Standards**

```tsx
// ✅ DO: Use proper state management patterns
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [data, setData] = useState<DataType[]>([])

// ✅ DO: Handle async operations properly
const handleSubmit = async () => {
  try {
    setLoading(true)
    setError(null)
    await submitData()
    toast({ title: "Success", description: "Data saved successfully" })
  } catch (err) {
    setError(err.message)
    toast({ title: "Error", description: err.message, variant: "destructive" })
  } finally {
    setLoading(false)
  }
}

// ✅ DO: Use proper cleanup
useEffect(() => {
  const controller = new AbortController()
  
  fetchData(controller.signal)
    .then(setData)
    .catch(setError)
  
  return () => controller.abort()
}, [])
```

## 📚 Contributing to the Schema

### **Adding New Patterns**

When you create a new design pattern or component:

1. **Document the pattern** in `frontend-design-schema.json`
2. **Add code examples** to the component template
3. **Update this README** with usage guidelines
4. **Create tests** for the new component
5. **Add to Storybook** if available

### **Schema Update Process**

```json
// Add to frontend-design-schema.json
{
  "components": {
    "newPattern": {
      "description": "Description of the new pattern",
      "structure": "CSS classes and structure",
      "variants": {
        "default": "Default implementation",
        "alternative": "Alternative implementation"
      },
      "example": "Code example"
    }
  }
}
```

### **Documentation Standards**

- **Clear descriptions** of when to use each pattern
- **Code examples** with proper TypeScript types
- **Visual examples** or screenshots when helpful
- **Mobile considerations** for responsive patterns
- **Accessibility notes** for complex interactions

---

**By following this comprehensive design schema, we ensure a consistent, professional, and maintainable user interface across the entire XGen MRP system. Every component contributes to a cohesive user experience while maintaining flexibility for future enhancements.** 