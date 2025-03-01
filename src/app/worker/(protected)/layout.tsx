// src/app/worker/(protected)/layout.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ThemeProvider } from "@/context/ThemeContext";
import LayoutWithTheme from "@/components/shared/LayoutWithTheme";

export default async function WorkerProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect if no session
  if (!session?.user) {
    redirect("/worker/login");
  }

  // Redirect if admin trying to access worker pages
  if (["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  return (
    <ThemeProvider>
      <LayoutWithTheme>{children}</LayoutWithTheme>
    </ThemeProvider>
  );
}
