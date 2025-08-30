import { Metadata } from "next";
import UsersPageClient from "@/components/module/admin/users/users-page-client";
import { CreateUserDialog } from "@/components/module/admin/users/create-user-dialog";
import { getUsers } from "@/lib/actions/users";
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
  title: "Users",
  description: "Manage system users and their roles",
};

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <PageContainer>
      {/* Page Header - Consistent shared layout */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Users</PageTitle>
          <PageDescription>
            Manage system users and their roles
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CreateUserDialog />
        </PageHeaderActions>
      </PageHeader>

      {/* Data Table */}
      <SectionCard heading="All Users">
        <UsersPageClient data={users} />
      </SectionCard>
    </PageContainer>
  );
}
