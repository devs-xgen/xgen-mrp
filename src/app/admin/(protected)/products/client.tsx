"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SimpleCreateProductDialog } from "@/components/module/admin/products/simple-create-product-dialog";
import type { ProductCategory } from "@prisma/client";

interface ProductsClientProps {
  initialProducts: any[];
  initialCategories: ProductCategory[];
}

export default function ProductsClient({
  initialProducts,
  initialCategories,
}: ProductsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [categories] = useState(initialCategories);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleProductCreated = (newProduct: any) => {
    setProducts([newProduct, ...products]);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-gray-600">
            Manage your product catalog and variants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </div>
      </div>

      {/* Simple Products List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Products ({products.length})</h2>
          
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">Create your first product to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Product
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>SKU: <code className="bg-gray-100 px-2 py-1 rounded">{product.sku}</code></span>
                        <span>Stock: {product.currentStock}</span>
                        <span>Price: ₱{Number(product.sellingPrice).toLocaleString()}</span>
                        {product.variants && product.variants.length > 0 && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {product.variants.length} variants
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Product Dialog */}
      <SimpleCreateProductDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        categories={categories}
        onSuccess={handleProductCreated}
      />
    </div>
  );
} 