import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import WorkerSidebar from "@/components/module/worker/workerSidebar"
import { authOptions } from "@/lib/auth"

export default async function WorkerProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/auth/signin')
    }

    if (session.user.role === 'ADMIN') {
        redirect('/admin/dashboard')
    }

    return (
        <div className="flex h-screen">
            <WorkerSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}