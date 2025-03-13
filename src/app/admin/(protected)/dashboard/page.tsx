import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    CircleDollarSign,
    PackageOpen,
    ShoppingCart,
    Users,
} from "lucide-react"
import { CURRENCY_SYMBOLS } from "@/lib/constant"

export const metadata: Metadata = {
    title: "Admin Dashboard",
    description: "Admin dashboard for inventory management",
}

export default function AdminDashboard() {
    const stats = [
        {
            title: "Total Revenue",
            value: `${CURRENCY_SYMBOLS.PESO}12,345`,
            icon: CircleDollarSign,
            trend: "+12%",
            trendDirection: "up",
        },
        {
            title: "Total Products",
            value: "234",
            icon: PackageOpen,
            trend: "+3",
            trendDirection: "up",
        },
        {
            title: "Active Orders",
            value: "45",
            icon: ShoppingCart,
            trend: "-5",
            trendDirection: "down",
        },
        {
            title: "Total Users",
            value: "89",
            icon: Users,
            trend: "+2",
            trendDirection: "up",
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of your inventory management system
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className={`text-xs ${stat.trendDirection === 'up'
                                ? 'text-green-500'
                                : 'text-red-500'
                                }`}>
                                {stat.trend} from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* DITO ANG IBANG COMPONENTS */}
        </div>
    )
}