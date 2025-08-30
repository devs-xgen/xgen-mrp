import { getAllProducts, getCategories } from "@/lib/actions/product";
import ProductsPageClient from "@/components/module/admin/products/products-page-client";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  return (
    <div className="p-2 sm:p-4">
      <ProductsPageClient data={products as any} categories={categories as any} />
    </div>
  );
}