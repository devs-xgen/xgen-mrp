// src/app/admin/(protected)/products/create/page.tsx
import { Metadata } from "next";
import { getCategories } from "@/lib/actions/product";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
  SectionCard,
} from "@/components/shared/page-layout";
import { Button } from "@/components/ui/button";
import { CreateProductsMultiClient } from "@/components/module/admin/products/create-products-multi-client";

export const metadata: Metadata = {
  title: "Create Products",
  description: "Add one or more products",
};

export default async function CreateProductsPage() {
  const categories = await getCategories();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Create Products</PageTitle>
          <PageDescription>Fill out one or multiple product forms and submit all at once.</PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/products">Back to Products</a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <PageBody>
        <SectionCard heading="Product Details" contentClassName="pt-6">
          <CreateProductsMultiClient categories={categories} />
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
}
