import UnifiedLayout from "@/components/shared/UnifiedLayout";

export default async function DeliveryProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedLayout
      allowedRoles={["DELIVERY"]}
      fallbackRoute="/"
      loginRoute="/delivery/login"
    >
      {children}
    </UnifiedLayout>
  );
}
