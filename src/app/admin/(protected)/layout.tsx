import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppSidebar from "@/components/shared/AppSidebar";
import { ThemeProvider } from "@/context/ThemeContext"; // Using ThemeProvider here

export default async function AdminProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    // Redirect if no session or not an admin
    if (!session?.user) {
        redirect('/admin/login');
    }

    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
        redirect('/worker/dashboard');
    }

    return (
        <ThemeProvider>
            <LayoutWithTheme>{children}</LayoutWithTheme>
        </ThemeProvider>
    );
}

const LayoutWithTheme = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex h-screen">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
    );
};
