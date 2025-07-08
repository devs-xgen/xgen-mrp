import UnifiedLayout from "@/components/shared/UnifiedLayout";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedLayout
      allowedRoles={["ADMIN", "MANAGER"]}
      fallbackRoute="/worker/dashboard"
      loginRoute="/admin/login"
    >
      {children}
    </UnifiedLayout>
  );
}
