import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryProfile } from "@/components/module/delivery/profile";

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
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      </div>
      <DeliveryProfile user={session.user} />
    </div>
  );
} 