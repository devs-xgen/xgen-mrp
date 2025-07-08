import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliverySettings } from "@/components/module/delivery/settings";

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
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      <DeliverySettings user={session.user} />
    </div>
  );
} 