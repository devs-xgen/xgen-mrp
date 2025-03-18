# Development Guidelines for XGen MRP System

This document outlines the development standards and architectural decisions for the XGen MRP system to ensure consistency, maintainability, and optimal performance.

## Project Structure

### Component Organization

1. **Role-Based Component Structure**
   - All page components must be organized by role in the component module
   - Follow the pattern: `/components/(role)/page`
   - Example:
     ```
     /components/admin/dashboard/
     /components/manager/production/
     /components/operator/inventory/
     /components/pos/orders/
     ```

2. **Shared Components**
   - Common components used across multiple roles should be placed in:
     ```
     /components/shared/
     ```

3. **UI Components**
   - Reusable UI elements should be placed in:
     ```
     /components/ui/
     ```

4. **Layout Components**
   - Layout components should be organized in:
     ```
     /components/layout/
     ```

### Page Structure

1. **App Router Organization**
   - Pages should be organized following Next.js App Router conventions
   - Role-based routes should be structured as:
     ```
     /app/(role)/path/page.tsx
     ```

2. **Page Component Pattern**
   - Each page file should be minimal and import components from the component module
   - Example:
     ```tsx
     // app/admin/products/page.tsx
     import { ProductsPage } from '@/components/admin/products'
     
     export default function Page() {
       return <ProductsPage />
     }
     ```

## Server Actions

### Implementation Guidelines

1. **Direct Server Actions**
   - Use Next.js Server Actions directly within components instead of creating separate API endpoints
   - Server actions should be defined in dedicated files within the component directory

2. **Server Action File Structure**
   - Create a `actions.ts` file within each component directory
   - Example:
     ```
     /components/admin/products/actions.ts
     ```

3. **Server Action Implementation**
   - Use the `"use server"` directive at the top of action files
   - Example:
     ```typescript
     // components/admin/products/actions.ts
     "use server"
     
     import { prisma } from '@/lib/prisma'
     import { revalidatePath } from 'next/cache'
     
     export async function createProduct(formData: FormData) {
       // Implementation
       const name = formData.get('name') as string
       // Validate data
       // Create product in database
       await prisma.product.create({
         data: {
           // Product data
         }
       })
       
       // Revalidate the products page
       revalidatePath('/admin/products')
     }
     ```

4. **Action Usage in Components**
   - Import server actions directly into client components
   - Example:
     ```tsx
     // components/admin/products/product-form.tsx
     "use client"
     
     import { createProduct } from './actions'
     
     export function ProductForm() {
       return (
         <form action={createProduct}>
           {/* Form fields */}
         </form>
       )
     }
     ```

### Data Fetching

1. **Component Data Fetching**
   - Fetch data directly in server components when possible
   - Example:
     ```tsx
     // components/admin/products/products-list.tsx
     import { prisma } from '@/lib/prisma'
     
     export async function ProductsList() {
       const products = await prisma.product.findMany()
       
       return (
         <div>
           {/* Render products */}
         </div>
       )
     }
     ```

2. **Reusable Data Fetching Functions**
   - Create reusable data fetching functions in a `data.ts` file within component directories
   - Example:
     ```typescript
     // components/admin/products/data.ts
     import { prisma } from '@/lib/prisma'
     
     export async function getProducts(filters?: any) {
       return prisma.product.findMany({
         where: filters,
         include: {
           category: true
         }
       })
     }
     ```

## Error Handling

1. **Server Action Error Handling**
   - Use try/catch blocks in server actions
   - Return structured responses with success/error information
   - Example:
     ```typescript
     export async function updateProduct(id: string, formData: FormData) {
       try {
         // Implementation
         return { success: true, data: updatedProduct }
       } catch (error) {
         console.error('Failed to update product:', error)
         return { 
           success: false, 
           error: error instanceof Error ? error.message : 'Unknown error' 
         }
       }
     }
     ```

2. **Client-Side Error Handling**
   - Handle errors from server actions in client components
   - Display appropriate error messages to users
   - Example:
     ```tsx
     "use client"
     import { useState } from 'react'
     import { updateProduct } from './actions'
     
     export function EditProductForm({ product }) {
       const [error, setError] = useState('')
       
       async function handleSubmit(formData) {
         const result = await updateProduct(product.id, formData)
         if (!result.success) {
           setError(result.error)
         }
       }
       
       return (
         <form action={handleSubmit}>
           {error && <div className="error">{error}</div>}
           {/* Form fields */}
         </form>
       )
     }
     ```

## Form Handling

1. **Form Submission**
   - Use the form action attribute with server actions
   - Leverage React's useFormStatus for loading states
   - Example:
     ```tsx
     "use client"
     import { useFormStatus } from 'react-dom'
     import { createProduct } from './actions'
     
     function SubmitButton() {
       const { pending } = useFormStatus()
       return (
         <button type="submit" disabled={pending}>
           {pending ? 'Creating...' : 'Create Product'}
         </button>
       )
     }
     
     export function ProductForm() {
       return (
         <form action={createProduct}>
           {/* Form fields */}
           <SubmitButton />
         </form>
       )
     }
     ```

2. **Form Validation**
   - Implement both client-side and server-side validation
   - Use Zod for schema validation
   - Example:
     ```typescript
     // components/admin/products/schema.ts
     import { z } from 'zod'
     
     export const productSchema = z.object({
       name: z.string().min(1, 'Name is required'),
       price: z.coerce.number().positive('Price must be positive'),
       // Other fields
     })
     
     // components/admin/products/actions.ts
     "use server"
     import { productSchema } from './schema'
     
     export async function createProduct(formData: FormData) {
       const data = Object.fromEntries(formData.entries())
       const result = productSchema.safeParse(data)
       
       if (!result.success) {
         return { success: false, errors: result.error.flatten().fieldErrors }
       }
       
       // Proceed with validated data
     }
     ```

## Authentication and Authorization

1. **Role-Based Access Control**
   - Implement role checks in server actions
   - Example:
     ```typescript
     "use server"
     import { getServerSession } from 'next-auth'
     import { authOptions } from '@/lib/auth'
     
     export async function adminAction() {
       const session = await getServerSession(authOptions)
       
       if (!session || session.user.role !== 'ADMIN') {
         throw new Error('Unauthorized')
       }
       
       // Proceed with admin action
     }
     ```

2. **Route Protection**
   - Use middleware for route protection
   - Implement role-specific layouts with session checks

## Performance Considerations

1. **Component Optimization**
   - Use React.memo for expensive client components
   - Implement proper keys in lists
   - Leverage Next.js Image component for optimized images

2. **Data Fetching Optimization**
   - Use selective fetching to minimize data transfer
   - Implement pagination for large datasets
   - Cache frequently accessed data

3. **Server Action Optimization**
   - Keep server actions focused and minimal
   - Use transactions for related database operations
   - Implement proper error handling and logging

## Example Component Structure

```
/components
  /admin
    /dashboard
      /actions.ts       # Server actions for dashboard
      /data.ts          # Data fetching functions
      /index.ts         # Export all components
      /metrics-card.tsx # Dashboard component
      /recent-orders.tsx # Dashboard component
    /products
      /actions.ts       # Server actions for products
      /data.ts          # Data fetching functions
      /index.ts         # Export all components
      /product-form.tsx # Product form component
      /products-list.tsx # Products list component
  /manager
    /production
      /actions.ts
      /data.ts
      /index.ts
      /production-schedule.tsx
  /operator
    /inventory
      /actions.ts
      /data.ts
      /index.ts
      /inventory-count.tsx
  /shared
    /data-table
    /filters
    /pagination
  /ui
    /button
    /dialog
    /form
  /layout
    /sidebar
    /header
    /footer
```

## Conclusion

Following these guidelines will ensure a consistent, maintainable, and performant codebase for the XGen MRP system. The role-based component organization combined with direct server actions provides a clean architecture that aligns with the business domain while leveraging the latest Next.js features. 