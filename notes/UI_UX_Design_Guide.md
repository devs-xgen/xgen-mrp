# UI/UX Design Guide for xgen-MRP

## Overview
This guide establishes consistent patterns for UI/UX design across the xgen-MRP manufacturing system. It covers component usage, loading states, data fetching patterns, and user experience best practices.

---

## Table of Contents
1. [Design Principles](#design-principles)
2. [Component Standards](#component-standards)
3. [Loading States & UX](#loading-states--ux)
4. [Data Fetching Patterns](#data-fetching-patterns)
5. [Layout & Spacing](#layout--spacing)
6. [Color & Status Systems](#color--status-systems)
7. [Form Design](#form-design)
8. [Table Design](#table-design)
9. [Dialog & Modal Patterns](#dialog--modal-patterns)
10. [Error Handling](#error-handling)
11. [AnalyticsCard Component](#analytics-card-component)

---

## Design Principles

### 1. **Progressive Loading**
- Always show loading states during data fetching
- Use skeleton loaders for predictable content
- Implement optimistic updates where appropriate

### 2. **Data-Heavy Optimization**
- Use TanStack Query for server state management
- Implement pagination for large datasets
- Cache frequently accessed data
- Show data counts and totals

### 3. **Industrial UX**
- Design for manufacturing environments
- Large, clickable targets for touch screens
- Clear visual hierarchy
- Minimal cognitive load

### 4. **Responsive & Accessible**
- Mobile-first approach
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios

---

## Component Standards

### **Page Layout Structure**
```tsx
// Standard page layout pattern
<div className="flex flex-col gap-6 p-8">
  {/* Header Section */}
  <div className="flex items-start justify-between">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
    <CreateButton />
  </div>

  {/* Content Section */}
  <Card>
    <CardHeader>
      <CardTitle>Content Title</CardTitle>
      <CardDescription>Content description</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Main content */}
    </CardContent>
  </Card>
</div>
```

### **Button Patterns**
```tsx
// Primary actions
<Button className="flex items-center gap-2">
  <Icon className="w-4 h-4" />
  Action Text
</Button>

// Secondary actions
<Button variant="outline" size="sm">
  Secondary Action
</Button>

// Destructive actions
<Button variant="destructive">
  <Trash2 className="w-4 h-4 mr-2" />
  Delete
</Button>
```

### **Status Badges**
```tsx
// Success states
<Badge variant="default" className="bg-green-500 text-white">
  <CheckCircle className="w-3 h-3 mr-1" />
  Active
</Badge>

// Warning states
<Badge variant="destructive" className="bg-yellow-500 text-white">
  <AlertTriangle className="w-3 h-3 mr-1" />
  Warning
</Badge>

// Error states
<Badge variant="destructive">
  <XCircle className="w-3 h-3 mr-1" />
  Error
</Badge>
```

---

## Loading States & UX

### **Page Loading**
```tsx
// Full page loading state
function LoadingPage() {
  return (
    <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h3 className="text-lg font-medium text-muted-foreground">
          Loading {entityName}...
        </h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we fetch your data
        </p>
      </div>
    </div>
  );
}
```

### **Component Loading**
```tsx
// Inline loading state
{loading ? (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
) : (
  <ActualContent />
)}
```

### **Skeleton Loading**
```tsx
// Table skeleton
<TableBody>
  {Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
    </TableRow>
  ))}
</TableBody>
```

---

## Data Fetching Patterns

### **TanStack Query Setup**
```tsx
// Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Custom hook pattern
function useCustomerOrders() {
  return useQuery({
    queryKey: ['customer-orders'],
    queryFn: getCustomerOrders,
    select: (data) => data.map(formatCustomerOrder),
  });
}
```

### **Mutation Patterns**
```tsx
// Create mutation
const createMutation = useMutation({
  mutationFn: createCustomerOrder,
  onSuccess: () => {
    queryClient.invalidateQueries(['customer-orders']);
    toast.success('Customer order created successfully');
  },
  onError: (error) => {
    toast.error(`Failed to create order: ${error.message}`);
  },
});

// Optimistic update
const updateMutation = useMutation({
  mutationFn: updateCustomerOrder,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['customer-orders']);
    const previousData = queryClient.getQueryData(['customer-orders']);
    
    queryClient.setQueryData(['customer-orders'], (old) =>
      old.map(item => item.id === newData.id ? { ...item, ...newData } : item)
    );
    
    return { previousData };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['customer-orders'], context.previousData);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['customer-orders']);
  },
});
```

---

## Layout & Spacing

### **Spacing Scale**
- `gap-2` (8px) - Tight spacing within components
- `gap-4` (16px) - Standard component spacing
- `gap-6` (24px) - Section spacing
- `gap-8` (32px) - Page-level spacing
- `p-4` (16px) - Card padding
- `p-6` (24px) - Large card padding
- `p-8` (32px) - Page padding

### **Grid Layouts**
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>

// Stats grid
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
</div>
```

---

## Color & Status Systems

### **Status Colors**
```css
/* Success - Green */
.success { @apply bg-green-500 text-white; }

/* Warning - Yellow */
.warning { @apply bg-yellow-500 text-white; }

/* Error - Red */
.error { @apply bg-red-500 text-white; }

/* Info - Blue */
.info { @apply bg-blue-500 text-white; }

/* Neutral - Gray */
.neutral { @apply bg-gray-500 text-white; }
```

### **Production Status Colors**
- **Active/In Progress**: `bg-blue-500`
- **Completed**: `bg-green-500`
- **Pending**: `bg-yellow-500`
- **Cancelled**: `bg-red-500`
- **On Hold**: `bg-orange-500`

---

## Form Design

### **Form Layout**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Form Title</CardTitle>
    <CardDescription>Form description</CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="field">Field Label</Label>
          <Input id="field" {...field} />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
```

### **Field Patterns**
```tsx
// Standard field
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
```

---

## Table Design

### **Enhanced Table Pattern**
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <div>
      <CardTitle>Table Title ({data.length})</CardTitle>
      <CardDescription>Table description</CardDescription>
    </div>
    <div className="flex items-center gap-2">
      <Input 
        placeholder="Search..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64"
      />
      <Button>Export</Button>
    </div>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Column 1</TableHead>
          <TableHead>Column 2</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.column1}</TableCell>
            <TableCell>{item.column2}</TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(item)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(item)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### **Expandable Rows**
```tsx
// Row with expandable details
<TableRow className={cn(
  "cursor-pointer hover:bg-muted/50",
  expanded && "bg-muted/30"
)}>
  <TableCell>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setExpanded(!expanded)}
      className="p-0 h-auto"
    >
      {expanded ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </Button>
  </TableCell>
  {/* Other cells */}
</TableRow>

{expanded && (
  <TableRow>
    <TableCell colSpan={columns.length}>
      <div className="p-4 bg-muted/20 rounded-lg">
        {/* Expanded content */}
      </div>
    </TableCell>
  </TableRow>
)}
```

---

## Dialog & Modal Patterns

### **Standard Dialog**
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        Dialog Title
      </DialogTitle>
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
      <Button onClick={handleAction} disabled={loading}>
        {loading ? "Processing..." : "Confirm"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### **Confirmation Dialog**
```tsx
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        Confirm Action
      </AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. Are you sure you want to proceed?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={handleConfirm}
      >
        {loading ? "Deleting..." : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Error Handling

### **Error States**
```tsx
// Error boundary component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message}
        </p>
        <Button onClick={resetErrorBoundary}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

// Query error state
if (error) {
  return (
    <Card className="border-destructive">
      <CardContent className="pt-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to load data
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message}
          </p>
          <Button onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### **Toast Notifications**
```tsx
// Success toast
toast.success("Operation completed successfully", {
  description: "Your changes have been saved.",
});

// Error toast
toast.error("Operation failed", {
  description: error.message,
  action: {
    label: "Retry",
    onClick: () => retryOperation(),
  },
});

// Loading toast
const loadingToast = toast.loading("Processing...", {
  description: "Please wait while we process your request.",
});

// Update loading toast
toast.success("Completed!", {
  id: loadingToast,
  description: "Operation completed successfully.",
});
```

---

## Best Practices

### **Performance**
1. **Lazy load** components and routes
2. **Memoize** expensive calculations
3. **Virtualize** large lists
4. **Optimize** images and assets
5. **Use** proper key props in lists

### **Accessibility**
1. **Semantic HTML** structure
2. **ARIA** labels and roles
3. **Keyboard** navigation
4. **Screen reader** compatibility
5. **Color contrast** ratios

### **User Experience**
1. **Progressive disclosure** of information
2. **Contextual** help and tooltips
3. **Consistent** interaction patterns
4. **Clear** visual feedback
5. **Efficient** workflows

### **Code Organization**
1. **Consistent** file naming
2. **Reusable** component patterns
3. **Type-safe** props and state
4. **Documented** component APIs
5. **Tested** critical paths

---

## Implementation Checklist

When implementing new features:

- [ ] Follow established layout patterns
- [ ] Implement proper loading states
- [ ] Add error boundaries and handling
- [ ] Use TanStack Query for data fetching
- [ ] Include proper TypeScript types
- [ ] Add accessibility attributes
- [ ] Test keyboard navigation
- [ ] Optimize for mobile devices
- [ ] Include proper documentation
- [ ] Follow color and spacing standards

---

## AnalyticsCard Component

### Overview
A custom analytics/statistics card component designed for displaying key metrics and KPIs throughout the system. Features a clean, minimal design with low opacity backgrounds and subtle borders - no shadows.

### Design Philosophy
- **Minimal Design**: Clean box design with subtle backgrounds and borders
- **No Shadows**: Flat design approach following modern UI trends
- **Low Opacity**: Soft, non-intrusive color schemes
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Proper color contrast and typography

### Usage
```tsx
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";

<AnalyticsCard
  title="Total Orders"
  value={120}
  icon="ShoppingCart"
  {...analyticsCardVariants.blue}
/>
```

### Props
- `title` (string): The metric title/label
- `value` (string | number): The main value to display
- `icon` (IconName): Optional icon name (string) from available Lucide icons
- `iconColor` (string): Custom icon color class
- `bgColor` (string): Custom background color class
- `borderColor` (string): Custom border color class
- `subtitle` (string): Optional subtitle text
- `className` (string): Additional CSS classes
- `onClick` (() => void): Optional click handler

### Available Icons
The component includes a comprehensive set of Lucide icons that can be used by passing their name as a string:
- `"ShoppingCart"`, `"CheckCircle"`, `"Package"`, `"AlertTriangle"`
- `"Users"`, `"TrendingUp"`, `"ClipboardList"`, `"Timer"`
- `"Factory"`, `"Clock"`, `"DollarSign"`, `"Activity"`
- And many more... (see the iconMap in the component for full list)

### Color Variants
Pre-configured color schemes for common use cases:

#### Blue Variant
```tsx
{...analyticsCardVariants.blue}
// Best for: Total counts, primary metrics
```

#### Green Variant
```tsx
{...analyticsCardVariants.green}
// Best for: Completed items, success metrics
```

#### Amber Variant
```tsx
{...analyticsCardVariants.amber}
// Best for: In-progress items, revenue, warnings
```

#### Red Variant
```tsx
{...analyticsCardVariants.red}
// Best for: Overdue items, critical alerts, errors
```

#### Purple Variant
```tsx
{...analyticsCardVariants.purple}
// Best for: Special metrics, secondary data
```

#### Slate Variant
```tsx
{...analyticsCardVariants.slate}
// Best for: Neutral metrics, general information
```

### Features
- **Responsive Typography**: Text scales appropriately on different screen sizes
- **Hover Effects**: Subtle animation and color changes on hover
- **Dark Mode Support**: Automatically adapts to light/dark themes
- **Clickable**: Optional onClick support with hover scaling
- **Truncation**: Long text is properly truncated with ellipsis
- **Flexible Layout**: Icon and content positioning that works across devices

### Current Implementation
Used in:
- **Production Orders Page**: Total Orders, Completed, In Progress, Overdue
- **Customer Orders Page**: Total Orders, Completed, Revenue, Need Production

### Design Specifications
- **Border Radius**: `rounded-lg` (8px)
- **Padding**: Responsive (`p-4 sm:p-6`)
- **Spacing**: `space-x-4` between icon and content
- **Typography**: 
  - Title: `text-sm font-medium text-muted-foreground`
  - Value: `text-2xl font-bold sm:text-3xl`
  - Subtitle: `text-xs text-muted-foreground`
- **Transitions**: `duration-200` for smooth animations

### Accessibility
- Proper semantic structure
- Color contrast compliance
- Keyboard navigation support
- Screen reader friendly
- Focus indicators

---

## Date Picker Implementation

### Overview
All date inputs throughout the system use proper Calendar components with Popover overlays instead of native browser date inputs. This ensures a consistent, responsive experience across all devices and browsers.

### Implementation Pattern
```tsx
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

<FormField
  control={form.control}
  name="dateField"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Date Label</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value ? (
              format(field.value, "PPP")
            ) : (
              <span>Pick a date</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today; // or custom validation
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Key Implementation Details

#### Schema Configuration
```tsx
// Use z.date() for proper Date object validation
const schema = z.object({
  dateField: z.date({
    required_error: "Date is required",
  }),
});
```

#### Form Default Values
```tsx
// Use Date objects in default values
defaultValues: {
  dateField: new Date(), // Not a string!
}
```

#### Critical Requirements
1. **No FormControl Wrapper**: Do NOT wrap PopoverTrigger Button with FormControl
2. **Button Type**: Always use `type="button"` to prevent form submission
3. **Full Width**: Use `w-full justify-start` for proper button styling
4. **Date Objects**: Schema and form values must use Date objects, not strings

#### CSS Dependencies
```css
/* Required in globals.css */
@import "react-day-picker/dist/style.css";
```

#### Z-Index Configuration
The Popover component is configured with high z-index to ensure proper display above modals:
```tsx
// In popover.tsx
className="z-[100] ..." // Higher than dialog z-50
```

### Common Issues Fixed

#### ❌ Incorrect Implementation
```tsx
// DON'T: FormControl wrapper prevents clicking
<PopoverTrigger asChild>
  <FormControl>
    <Button>...</Button>
  </FormControl>
</PopoverTrigger>

// DON'T: String schema causes type errors
orderDate: z.string().min(1, "Required")

// DON'T: No button type can trigger form submission
<Button variant="outline">...</Button>
```

#### ✅ Correct Implementation
```tsx
// DO: Direct Button without FormControl
<PopoverTrigger asChild>
  <Button type="button" variant="outline">...</Button>
</PopoverTrigger>

// DO: Date schema for proper typing
orderDate: z.date({ required_error: "Required" })

// DO: Explicit button type
<Button type="button" variant="outline">...</Button>
```

### Responsive Design
All date pickers automatically adapt to screen size:
- **Mobile**: Full width, proper touch targets
- **Desktop**: Optimal spacing and alignment
- **Modal Context**: Proper z-index stacking

### Currently Implemented
- ✅ Production Order Dialog (start date, due date)
- ✅ Customer Order Dialog (order date, required date)
- ✅ Quality Check Dialogs
- ✅ Operation Dialogs
- ✅ All admin forms with date inputs

---

This guide ensures consistency across the xgen-MRP system and provides a foundation for scalable, maintainable UI/UX development. 