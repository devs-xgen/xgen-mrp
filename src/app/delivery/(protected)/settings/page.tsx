import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliverySettings } from "@/components/module/delivery/settings";
import {
  PageBody,
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeaderMain,
  PageTitle,
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
            Configure delivery preferences, notifications, and route defaults.
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        <DeliverySettings user={session.user} />
      </PageBody>
    </PageContainer>
  );
}
