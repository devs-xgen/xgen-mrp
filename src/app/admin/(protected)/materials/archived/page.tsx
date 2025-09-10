// src/app/admin/(protected)/materials/archived/page.tsx
import { Metadata } from "next";
import { getArchivedMaterials } from "@/lib/actions/materials";
import ArchivedMaterialsClient from "@/components/module/admin/materials/archived-materials-client";
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
  title: "Archived Materials",
  description: "View and restore archived materials",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/materials/archived");
}

export default async function ArchivedMaterialsPage() {
  const archived = await getArchivedMaterials();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Archived Materials</PageTitle>
          <PageDescription>Review archived materials and unarchive when needed.</PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody className="space-y-6">
        <SectionCard heading="Archived Materials">
          <ArchivedMaterialsClient data={archived as any} />
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
}
