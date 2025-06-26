# XGen MRP Frontend Design Schema

This document provides guidance on how to use the Frontend Design Schema to maintain consistency across the XGen MRP application with enhanced visual appeal through Tailwind CSS custom properties.

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

## Contributing to the Schema

If you create a new design pattern or component that could be reused:

1. Add it to the schema in `frontend-design-schema.json`
2. Document the pattern with examples
3. Update this README if necessary

By maintaining and following this schema, we ensure a consistent, high-quality user experience across the entire application. 