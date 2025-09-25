import { Metadata } from "next";

import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  SectionCard,
} from "@/components/shared/page-layout";
import { getGlobalUsers } from "@/lib/actions/superadmin";
import { SuperAdminUsersClient } from "@/components/module/superadmin/users/superadmin-users-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Global Users",
  description: "Manage users across all organizations",
};

export default async function SuperAdminUsersPage() {
  const [users, session] = await Promise.all([
    getGlobalUsers(),
    getServerSession(authOptions),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Global Users</PageTitle>
          <PageDescription>
            Audit, manage, and reset credentials for every user in the platform.
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      {/* <SectionCard> */}
        <SuperAdminUsersClient
          data={users}
          currentUserId={session?.user?.id}
        />
      {/* </SectionCard> */}
    </PageContainer>
  );
}
