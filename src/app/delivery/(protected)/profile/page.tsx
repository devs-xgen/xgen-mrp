import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryProfile } from "@/components/module/delivery/profile";
import {
  PageBody,
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
} from "@/components/shared/page-layout";

export const metadata: Metadata = {
  title: "Delivery Profile",
  description: "Manage your delivery profile",
};

export default async function DeliveryProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/delivery/login");
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Profile</PageTitle>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        <DeliveryProfile user={session.user} />
      </PageBody>
    </PageContainer>
  );
}