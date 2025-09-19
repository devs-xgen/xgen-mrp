// src/app/admin/(protected)/materials/create/page.tsx
import { Metadata } from "next";
import { getMaterialTypes, getUnitOfMeasures, getSuppliers } from "@/lib/actions/materials";
import { CreateMaterialsMultiClient } from "@/components/module/admin/materials/create-materials-multi-client";
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

export const metadata: Metadata = {
  title: "Create Material",
  description: "Add a new material to your inventory",
};

export default async function CreateMaterialPage() {
  const [materialTypes, unitOfMeasures, suppliers] = await Promise.all([
    getMaterialTypes(),
    getUnitOfMeasures(),
    getSuppliers(),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Create Material</PageTitle>
          <PageDescription>Fill out the details to add a new material.</PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/materials">Back to Materials</a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <PageBody>
        <SectionCard heading="Material Details" contentClassName="pt-6">
          <CreateMaterialsMultiClient
            materialTypes={materialTypes}
            unitOfMeasures={unitOfMeasures}
            suppliers={suppliers}
          />
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
}
