# Extracted Design Patterns from Sales Invoices

**Source:** `src/app/admin/(protected)/billing/sales-invoices/`  
**Status:** ✅ These are PROVEN patterns from working code  
**Purpose:** Apply these exact patterns to ALL admin pages for consistency

## 🎯 Key Findings

The sales-invoices pages demonstrate the **actual working patterns** used in the codebase. These patterns should be replicated exactly across all admin pages.

## 📋 List/Dashboard Pages Pattern

### **Container Structure**
```tsx
<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
  {/* Simple header */}
  {/* Dashboard component */}
  {/* Client component */}
</div>
```

### **Page Header**
```tsx
<div className="flex items-center justify-between space-y-2">
  <h2 className="text-3xl font-bold tracking-tight">Page Title</h2>
  {/* Optional action buttons */}
</div>
```

### **Key Details:**
- ✅ Uses `h2` element (not h1) for page titles
- ✅ Uses `space-y-4` for main content spacing
- ✅ Uses `p-4 md:p-8 pt-6` for responsive padding
- ✅ Simple, clean header structure
- ✅ Direct component composition without wrapping in Cards

## 📝 Form Pages Pattern

### **Container Structure**
```tsx
<div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
  {/* Complex header with back button and actions */}
  {/* Form grid layout */}
</div>
```

### **Page Header**
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <Link href="/back-url">
      <Button variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to List
      </Button>
    </Link>
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Create/Edit Item</h1>
      <p className="text-muted-foreground mt-1">Description</p>
    </div>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">Save</Button>
  </div>
</div>
```

### **Form Layout**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main Form - 2/3 width */}
  <div className="lg:col-span-2 space-y-6">
    <Card className="bg-card border rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Section Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form content */}
      </CardContent>
    </Card>
  </div>
  
  {/* Sidebar - 1/3 width */}
  <div className="space-y-6">
    <Card className="bg-card border rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Summary/Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Sidebar content */}
      </CardContent>
    </Card>
  </div>
</div>
```

### **Key Details:**
- ✅ Uses `h1` element for form page titles
- ✅ Uses `gap-6` for form section spacing
- ✅ Uses `space-y-6` within form sections
- ✅ Uses `p-8` fixed padding (no responsive variants)
- ✅ Grid layout: `lg:grid-cols-3` with `lg:col-span-2` main content

## 🎨 Card Standards

### **Standard Card**
```tsx
<Card className="bg-card border rounded-lg">
  <CardHeader className="pb-4">
    <CardTitle className="text-lg">Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### **Key Details:**
- ✅ Always use `bg-card border rounded-lg`
- ✅ CardHeader uses `pb-4` for consistent spacing
- ✅ CardTitle uses `text-lg` class
- ✅ CardContent uses default padding

## 📱 Responsive Patterns

### **Breakpoints Used:**
- `md:p-8` - Enhanced padding at 768px+
- `lg:grid-cols-3` - Three-column layout at 1024px+
- `lg:col-span-2` - Two-column span for main content

### **Padding Pattern:**
- List pages: `p-4 md:p-8 pt-6`
- Form pages: `p-8` (fixed)

## 🔧 Button Patterns

### **Action Button Sizes:**
```tsx
<Button size="sm">Primary Action</Button>
<Button variant="outline" size="sm">Secondary Action</Button>
<Button variant="ghost" size="sm">Back/Cancel</Button>
```

### **Button with Icons:**
```tsx
<Button variant="ghost" size="sm">
  <ArrowLeft className="mr-2 h-4 w-4" />
  Back
</Button>
```

## 📊 Component Composition

### **List Pages Follow This Pattern:**
1. **Page Container** with proper padding and spacing
2. **Simple Header** with title and optional actions
3. **Dashboard Component** (if analytics needed)
4. **Client Component** (handles data table and interactions)

### **Form Pages Follow This Pattern:**
1. **Page Container** with fixed padding
2. **Complex Header** with back button, title, and actions
3. **Grid Layout** with main content and sidebar
4. **Form Cards** with consistent styling

## ✅ Implementation Checklist

When creating/updating admin pages, ensure:

### **List Pages:**
- [ ] Use `flex-1 space-y-4 p-4 md:p-8 pt-6` container
- [ ] Use `h2` element with `text-3xl font-bold tracking-tight`
- [ ] Use simple header: `flex items-center justify-between space-y-2`
- [ ] Compose dashboard and client components directly
- [ ] Use `space-y-4` for main content spacing

### **Form Pages:**
- [ ] Use `flex flex-col gap-6 p-8 bg-background min-h-screen` container
- [ ] Use `h1` element with `text-3xl font-bold tracking-tight`
- [ ] Include back button with ArrowLeft icon
- [ ] Use `grid grid-cols-1 lg:grid-cols-3 gap-6` layout
- [ ] Main content uses `lg:col-span-2 space-y-6`
- [ ] Sidebar uses `space-y-6`

### **Cards:**
- [ ] Always use `bg-card border rounded-lg`
- [ ] CardHeader uses `pb-4`
- [ ] CardTitle uses `text-lg`
- [ ] Follow form section pattern within cards

### **Buttons:**
- [ ] Use `size="sm"` for header actions
- [ ] Use proper variants (outline for secondary, ghost for back)
- [ ] Include proper icons with consistent spacing

## 🚫 What NOT to Do

### **Avoid These Patterns:**
- ❌ Don't use `h1` for list page titles (use `h2`)
- ❌ Don't use `gap-6` for list page content (use `space-y-4`)
- ❌ Don't wrap dashboard/client components in Cards on list pages
- ❌ Don't use `sm:` breakpoints for padding (use `md:`)
- ❌ Don't create complex headers for simple list pages
- ❌ Don't use responsive title sizing (`text-2xl sm:text-3xl`)

## 🎯 Success Criteria

A page follows the pattern correctly when:

1. **Visual Consistency** - Looks identical to sales-invoices pages
2. **Spacing Consistency** - Uses exact same padding and spacing
3. **Typography Consistency** - Uses correct heading elements and sizes
4. **Component Consistency** - Uses same card styling and button patterns
5. **Layout Consistency** - Follows grid patterns for forms, simple structure for lists

---

**These patterns are extracted from working, proven code. Follow them exactly to ensure consistency across the entire admin interface.**
