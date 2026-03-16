import { Metadata } from "next";
import { getTrashedMaterials } from "@/lib/actions/materials";
import { TrashedMaterialsClient } from "@/components/module/admin/materials/trashed-materials-client";
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
  title: "Trash — Materials",
  description: "View and restore recently deleted materials",
};

export default async function TrashedMaterialsPage() {
  const trashed = await getTrashedMaterials();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Trash — Materials</PageTitle>
          <PageDescription>
            Recently deleted materials. Records are permanently removed after 30 days.
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody className="space-y-6">
        <SectionCard heading="Recently Deleted Materials">
          <TrashedMaterialsClient data={trashed} />
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
}
