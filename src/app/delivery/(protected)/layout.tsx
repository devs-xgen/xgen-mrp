import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ThemeProvider } from "@/context/ThemeContext"; // ThemeProvider is fine in server components
import LayoutWithTheme from "@/components/shared/LayoutWithTheme"; // Import the new client component

export default async function DeliveryProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect if no session
  if (!session?.user) {
    redirect("/delivery/login");
  }

  // Redirect if not a delivery user
  if (session.user.role !== "DELIVERY") {
    redirect("/");
  }

  return (
    <ThemeProvider>
      <LayoutWithTheme>{children}</LayoutWithTheme>
    </ThemeProvider>
  );
}
