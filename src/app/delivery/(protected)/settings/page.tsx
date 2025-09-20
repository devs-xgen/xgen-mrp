import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliverySettings } from "@/components/module/delivery/settings";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
} from "@/components/shared/page-layout";

export const metadata: Metadata = {
  title: "Delivery Settings",
  description: "Manage your delivery settings and preferences",
};

export default async function DeliverySettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/delivery/login");
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Settings</PageTitle>
          <PageDescription>
            Dashboard details and analytics for user{" "}
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageHeaderActions></PageHeaderActions>
      <PageBody>
        <DeliverySettings user={session.user} />
      </PageBody>
    </PageContainer>
  );
}
