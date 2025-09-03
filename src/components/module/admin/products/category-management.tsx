"use client"

import type { ProductCategory } from "@prisma/client"
import { ProductCategoryDialog } from "@/components/module/admin/products/product-category-dialog"

interface CategoryManagementProps {
    categories: ProductCategory[]
    onSuccess?: () => Promise<void>
}

export function CategoryManagement({ categories, onSuccess }: CategoryManagementProps) {
    return (
        <ProductCategoryDialog categories={categories} onSuccess={onSuccess} />
    )
}