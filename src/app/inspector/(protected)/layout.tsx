// src/app/worker/(protected)/layout.tsx
import UnifiedLayout from "@/components/shared/UnifiedLayout";

export default async function InspectorProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedLayout
      allowedRoles={["INSPECTOR"]}
      fallbackRoute="/admin/dashboard"
      loginRoute="/inspector/login"
    >
      {children}
    </UnifiedLayout>
  );
}
