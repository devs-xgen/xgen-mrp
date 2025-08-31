import { Metadata } from "next";
import { getAllProducts, getCategories } from "@/lib/actions/product";
import ProductsPageClient from "@/components/module/admin/products/products-page-client";
import { 
  PageContainer,
  PageHeader, 
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard 
} from "@/components/shared/page-layout";
import { CreateProductButton } from "@/components/module/admin/products/create-product-button";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Products",
  description: "Manage products, variants, and production",
};

// Server action to refresh data
async function refreshData() {
  "use server";
  revalidatePath("/admin/products");
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Products</PageTitle>
          <PageDescription>
            Manage products, variants, and production
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CreateProductButton categories={categories as any} onSuccess={refreshData} />
        </PageHeaderActions>
      </PageHeader>

      <SectionCard heading="All Products">
        <ProductsPageClient data={products as any} categories={categories as any} />
      </SectionCard>
    </PageContainer>
  );
}