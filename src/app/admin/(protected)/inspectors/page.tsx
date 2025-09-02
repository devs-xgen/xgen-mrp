import { Metadata } from "next";
import Link from "next/link";
import { Users, UserPlus } from "lucide-react";
import {
  getInspectors,
  getDepartments,
  getSpecializations,
} from "@/lib/actions/inspector";
import { InspectorManagement } from "@/components/module/admin/inspectors/inspector-management";
import { CreateInspectorDialog } from "@/components/module/admin/inspectors/create-inspector-dialog";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";

// Import page layout components
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";

export const metadata: Metadata = {
  title: "Inspectors",
  description: "Manage and monitor your quality inspection personnel",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/inspectors");
}

export default async function InspectorsPage() {
  // Fetch data for the inspectors page
  const inspectors = await getInspectors();
  const departments = await getDepartments();
  const specializations = await getSpecializations();

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Inspectors</PageTitle>
          <PageDescription>
            Manage and monitor your quality inspection personnel
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <Link href="/admin/users">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Link>
          </Button>
          <CreateInspectorDialog
            departments={departments}
            specializations={specializations}
            onSuccess={refreshData}
          />
        </PageHeaderActions>
      </PageHeader>

      {/* Inspector Management */}
      <SectionCard heading="All Inspectors">
        <InspectorManagement data={inspectors} />
      </SectionCard>
    </PageContainer>
  );
}
