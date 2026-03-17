import { Metadata } from "next";
import UsersPageClient from "@/components/module/admin/users/users-page-client";
import { CreateUserDialog } from "@/components/module/admin/users/create-user-dialog";
import { getPaginatedUsers } from "@/lib/actions/users";
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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;
  const limitParam = resolvedSearchParams.limit;
  const searchParam = resolvedSearchParams.search;

  const page = Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1;
  const limit = Number(Array.isArray(limitParam) ? limitParam[0] : limitParam) || 10;
  const search = typeof searchParam === "string" ? searchParam : "";

  const usersData = await getPaginatedUsers({ page, limit, search });

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
        <UsersPageClient
          data={usersData.data}
          metadata={usersData.metadata}
        />
      </SectionCard>
    </PageContainer>
  );
}
