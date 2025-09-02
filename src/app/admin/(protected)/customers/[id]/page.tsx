import { redirect } from "next/navigation";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  // Redirect base customer detail route to the Orders subpage for now
  const { id } = await params;
  redirect(`/admin/customers/${id}/orders`);
}
