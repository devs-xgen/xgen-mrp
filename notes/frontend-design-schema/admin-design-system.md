# XGen MRP Admin Design System

**Purpose:** Comprehensive design system for consistent admin page layouts  
**Scope:** All pages in `src/app/admin/(protected)/`  
**Last Updated:** January 20, 2025

## Design Philosophy

### 1. **Consistency First**
- All admin pages must follow the same layout patterns
- Use the same components, spacing, and typography throughout
- Consistent navigation and user experience across all modules

### 2. **Mobile-First Responsive**
- Design works on mobile (320px+) first, then enhance for larger screens
- Stack layouts vertically on mobile, use columns on desktop
- Hide less important elements on small screens

### 3. **Manufacturing-Focused UX**
- Large touch targets for industrial environments
- Clear visual hierarchy for quick scanning
- Minimal cognitive load during busy operations

## Page Layout Standards

### **Base Page Structure**
All admin pages must use this exact structure (based on sales-invoices pattern):

#### **List/Dashboard Pages:**
```tsx
<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
  {/* Page Header - Simple & Clean */}
  <div className="flex items-center justify-between space-y-2">
    <h2 className="text-3xl font-bold tracking-tight">{pageTitle}</h2>
    {/* Optional action buttons */}
  </div>
  
  {/* Dashboard Component (if applicable) */}
  <DashboardComponent />
  
  {/* Main Content Component */}
  <MainContentComponent />
</div>
```

#### **Form/Detail Pages:**
```tsx
<div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
  {/* Page Header with Actions */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Link href="/back-url">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-muted-foreground mt-1">{pageDescription}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {/* Action buttons */}
    </div>
  </div>

  {/* Form or Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main content */}
    <div className="lg:col-span-2 space-y-6">
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{cardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Card content */}
        </CardContent>
      </Card>
    </div>
    
    {/* Sidebar */}
    <div className="space-y-6">
      {/* Sidebar cards */}
    </div>
  </div>
</div>
```

## Standard Page Types

### 1. **List/Table Pages** (Most Common)
Used for: Products, Orders, Materials, Users, etc.

**Structure:**
- Page header with title and "Add" button
- Optional analytics cards (4-column grid)
- Data table with search, filters, and actions
- Pagination controls

**Example:** Products, Customer Orders, Materials

### 2. **Detail Pages**
Used for: View single item details

**Structure:**
- Page header with title and edit/back buttons
- Information cards in responsive grid
- Related data sections

**Example:** Product Details, Order Details

### 3. **Form Pages**
Used for: Create/Edit items

**Structure:**
- Page header with title and save/cancel buttons
- Form in Card with organized sections
- Validation and loading states

**Example:** Add Product, Edit Customer

### 4. **Dashboard Pages**
Used for: Analytics and overview

**Structure:**
- Page header with title and date controls
- Analytics cards grid
- Charts and graphs
- Quick action sections

**Example:** Main Dashboard, Reports

## Component Standards

### **Required Components**
Use ONLY these shadcn/ui components. Never create custom alternatives:

- `Button` - All actions and navigation
- `Card` - All content containers
- `Input` - All text inputs
- `Select` - All dropdowns
- `Table` - All tabular data
- `Badge` - All status indicators
- `Dialog` - All modals
- `DropdownMenu` - All action menus

### **Color System**
Use these semantic CSS classes (never custom hex codes):

```tsx
// Backgrounds
bg-background     // Page background
bg-card          // Card backgrounds
bg-muted         // Subtle highlights
bg-secondary     // Nested content

// Text
text-foreground      // Primary text
text-muted-foreground // Secondary text
text-destructive     // Error text

// Status Colors (only for badges/status)
bg-green-500 text-white    // Success/Active
bg-blue-500 text-white     // Info/Processing
bg-yellow-500 text-white   // Warning/Pending
bg-red-500 text-white      // Error/Failed
bg-gray-500 text-white     // Inactive/Cancelled
```

### **Typography Scale**
```tsx
// Page titles (List pages use h2)
<h2 className="text-3xl font-bold tracking-tight">

// Page titles (Form pages use h1)  
<h1 className="text-3xl font-bold tracking-tight">

// Page descriptions
<p className="text-muted-foreground mt-1">

// Card titles
<CardTitle className="text-lg">

// Body text
text-sm

// Helper text
text-xs text-muted-foreground
```

### **Spacing Scale**
```tsx
// List/Dashboard pages - main content spacing
space-y-4

// Form pages - between sections  
gap-6

// Form pages - within sections
space-y-6

// Within components/form fields
gap-4

// Small components
gap-2

// Page padding (List pages)
p-4 md:p-8 pt-6

// Page padding (Form pages)
p-8

// Card header padding
pb-4

// Card content padding
Default CardContent padding
```

## Responsive Breakpoints

### **Mobile (< 768px)**
- Single column layouts
- Simple header structure
- Essential content only
- Full-width forms
- Stacked button groups

### **Tablet (768px - 1024px)**
- Two-column grids where appropriate
- Enhanced padding (md:p-8)
- More content visible
- Side-by-side layouts

### **Desktop (1024px+)**
- Multi-column grids (lg:grid-cols-3)
- Full sidebar layouts
- Complete feature access
- Optimized spacing

## Common Patterns

### **Analytics Cards Grid**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center space-x-4">
        <Icon className="h-8 w-8 text-blue-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {subtitle}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

### **Data Table Pattern**
```tsx
<Card>
  <CardHeader>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Search..." 
          className="w-full sm:w-64"
        />
        <Button>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="rounded-md border">
      <Table>
        {/* Table content */}
      </Table>
    </div>
  </CardContent>
</Card>
```

### **Form Layout Pattern**
```tsx
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>
    <form className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="field">Field Label *</Label>
          <Input id="field" placeholder="Enter value..." />
        </div>
        {/* More fields */}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button variant="outline" type="button">
          Cancel
        </Button>
        <Button type="submit">
          Save
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
```

### **Action Buttons Pattern**
```tsx
// Page header actions
<div className="flex items-center gap-2">
  <Button variant="outline" size="sm" className="hidden sm:flex">
    <Download className="h-4 w-4 mr-2" />
    Export
  </Button>
  <Button>
    <Plus className="h-4 w-4 sm:mr-2" />
    <span className="hidden sm:inline">Add New</span>
    <span className="sm:hidden">Add</span>
  </Button>
</div>

// Table row actions
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      <Eye className="h-4 w-4 mr-2" />
      View
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Status Badge Standards

### **Order/Production Status**
```tsx
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
    case 'COMPLETED':
      return <Badge className="bg-green-500 text-white">Active</Badge>
    case 'PENDING':
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-500 text-white">Pending</Badge>
    case 'OVERDUE':
    case 'FAILED':
      return <Badge className="bg-red-500 text-white">Overdue</Badge>
    case 'CANCELLED':
      return <Badge className="bg-gray-500 text-white">Cancelled</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}
```

### **Stock Status**
```tsx
const getStockBadge = (level: 'normal' | 'low' | 'out') => {
  switch (level) {
    case 'normal':
      return <Badge variant="outline">In Stock</Badge>
    case 'low':
      return <Badge className="bg-yellow-500 text-white">Low Stock</Badge>
    case 'out':
      return <Badge className="bg-red-500 text-white">Out of Stock</Badge>
  }
}
```

## Loading States

### **Page Loading**
```tsx
{loading && (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Loading...</span>
  </div>
)}
```

### **Table Loading**
```tsx
{loading ? (
  <TableBody>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      </TableRow>
    ))}
  </TableBody>
) : (
  <TableBody>
    {/* Actual data */}
  </TableBody>
)}
```

### **Empty States**
```tsx
{items.length === 0 && (
  <div className="text-center py-12">
    <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium mb-2">No Items Found</h3>
    <p className="text-muted-foreground">
      Get started by adding your first item.
    </p>
    <Button className="mt-4">
      <Plus className="h-4 w-4 mr-2" />
      Add Item
    </Button>
  </div>
)}
```

## Implementation Checklist

For every admin page, ensure:

- [ ] Uses base page structure with proper header
- [ ] Responsive design (mobile-first)
- [ ] Consistent spacing (gap-6, p-4/sm:p-6/lg:p-8)
- [ ] Proper typography scale
- [ ] Loading states for all async operations
- [ ] Empty states for lists/tables
- [ ] Error handling with proper messages
- [ ] Consistent button placement and styling
- [ ] Status badges follow color standards
- [ ] Action menus use dropdown pattern
- [ ] Form validation and feedback
- [ ] Accessibility (keyboard navigation, labels)

## File Organization

```
src/app/admin/(protected)/
├── [module]/
│   ├── page.tsx          # List page
│   ├── [id]/
│   │   ├── page.tsx      # Detail page
│   │   └── edit/
│   │       └── page.tsx  # Edit form page
│   └── new/
│       └── page.tsx      # Create form page
```

## Next Steps

1. **Audit Existing Pages**: Review all admin pages against this standard
2. **Create Page Templates**: Build reusable templates for each page type
3. **Update Components**: Ensure all pages use standard components
4. **Responsive Testing**: Test all pages on mobile, tablet, desktop
5. **Documentation**: Keep this guide updated as patterns evolve

---

**This design system ensures a consistent, professional, and maintainable admin interface that provides an excellent user experience across all devices and use cases.**
