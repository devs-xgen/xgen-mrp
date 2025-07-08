// src/app/worker/(protected)/layout.tsx
import UnifiedLayout from "@/components/shared/UnifiedLayout";

export default async function WorkerProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedLayout
      allowedRoles={["WORKER"]}
      fallbackRoute="/admin/dashboard"
      loginRoute="/worker/login"
    >
      {children}
    </UnifiedLayout>
  );
}
