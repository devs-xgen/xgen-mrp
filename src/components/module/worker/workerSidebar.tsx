'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    Settings,
    LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/worker/dashboard' },
    { icon: Package, label: 'Inventory', href: '/worker/inventory' },
    { icon: ClipboardList, label: 'Orders', href: '/worker/orders' },
    { icon: Settings, label: 'Settings', href: '/worker/settings' },
]

export default function WorkerSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col bg-slate-800 text-slate-100">
            <div className="p-4 border-b border-slate-700">
                <h1 className="text-xl font-bold">Inventory System</h1>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                pathname === item.href
                                    ? 'bg-slate-700 text-slate-100'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}