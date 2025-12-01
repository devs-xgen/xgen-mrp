import { Metadata } from "next";
import { getPaginatedProducts, getCategories } from "@/lib/actions/product";
import { Status } from "@prisma/client";

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
import { ProductCategoryDialog } from "@/components/module/admin/products/product-category-dialog";
import { InventoryFlowInfoSheet } from "@/components/module/admin/products/inventory-flow-info-sheet";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Products",
  description: "Manage products, variants, and production",
};

// Server action to refresh data
async function refreshData() {
  "use server";
  revalidatePath("/admin/products");
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;
  const limitParam = resolvedSearchParams.limit;
  const searchParam = resolvedSearchParams.search;
  const statusParam = resolvedSearchParams.status;
  const categoryParam = resolvedSearchParams.categoryId;
  const priceMinParam = resolvedSearchParams.priceMin;
  const priceMaxParam = resolvedSearchParams.priceMax;
  const stockMinParam = resolvedSearchParams.stockMin;
  const stockMaxParam = resolvedSearchParams.stockMax;

  const coerceNumber = (value: string | string[] | undefined) => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const page = Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1;
  const limit = Number(Array.isArray(limitParam) ? limitParam[0] : limitParam) || 10;
  const search = typeof searchParam === "string" ? searchParam : "";
  const status =
    typeof statusParam === "string" && statusParam in Status
      ? (statusParam as Status)
      : undefined;
  const categoryId = typeof categoryParam === "string" ? categoryParam : undefined;
  const priceMin = coerceNumber(priceMinParam);
  const priceMax = coerceNumber(priceMaxParam);
  const stockMin = coerceNumber(stockMinParam);
  const stockMax = coerceNumber(stockMaxParam);

  const [productsData, categories] = await Promise.all([
    getPaginatedProducts({
      page,
      limit,
      search,
      status,
      categoryId,
      priceMin,
      priceMax,
      stockMin,
      stockMax,
    }),
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
          <InventoryFlowInfoSheet />
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/products/archived">View Archived</a>
          </Button>
          <Button asChild>
            <a href="/admin/products/create">Create Product</a>
          </Button>
          <ProductCategoryDialog categories={categories as any} onSuccess={refreshData} />
        </PageHeaderActions>
      </PageHeader>

      <SectionCard heading="All Products">
        <ProductsPageClient
          data={productsData.data as any}
          metadata={productsData.metadata}
          categories={(categories as any) ?? []}
        />
      </SectionCard>
    </PageContainer>
  );
}