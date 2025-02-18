import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import AppSidebar from "@/components/shared/AppSidebar"

export default async function AdminProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/admin/login')
    }

    // Check if user has admin role
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
        redirect('/worker/dashboard')
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto p-8 transition-all duration-300">
                {children}
            </main>
        </div>
    )
}