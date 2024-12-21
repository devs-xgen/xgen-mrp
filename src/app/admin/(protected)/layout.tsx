import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/module/admin/adminSidebar"
import { authOptions } from "@/lib/auth"

export default async function AdminProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/admin/login')
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}