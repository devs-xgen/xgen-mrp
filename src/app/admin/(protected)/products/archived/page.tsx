// src/app/admin/(protected)/products/archived/page.tsx
import { Metadata } from "next";
import { getArchivedProducts } from "@/lib/actions/product";
import ArchivedProductsClient from "@/components/module/admin/products/archived-products-client";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
  SectionCard,
} from "@/components/shared/page-layout";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Archived Products",
  description: "View and restore archived products",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/products/archived");
}

export default async function ArchivedProductsPage() {
  const archived = await getArchivedProducts();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Archived Products</PageTitle>
          <PageDescription>Review archived products and unarchive when needed.</PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody className="space-y-6">
        <SectionCard heading="Archived Products">
          <ArchivedProductsClient data={archived as any} />
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
}
