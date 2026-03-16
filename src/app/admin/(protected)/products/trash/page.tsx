import { Metadata } from "next";
import { getTrashedProducts } from "@/lib/actions/product";
import { TrashedProductsClient } from "@/components/module/admin/products/trashed-products-client";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
  SectionCard,
} from "@/components/shared/page-layout";

export const metadata: Metadata = {
  title: "Trash — Products",
  description: "View and restore recently deleted products",
};

export default async function TrashedProductsPage() {
  const trashed = await getTrashedProducts();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Trash — Products</PageTitle>
          <PageDescription>
            Recently deleted products. Records are permanently removed after 30 days.
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody className="space-y-6">
        <SectionCard heading="Recently Deleted Products">
          <TrashedProductsClient data={trashed} />
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
}
