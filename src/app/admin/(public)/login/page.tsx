import { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/global/login/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
    title: "Admin Login",
    description: "Login to access the admin dashboard",
}

export default function AdminLoginPage() {
    return (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Admin Login
                        </CardTitle>
                        <CardDescription>
                            Enter your credentials to access the admin dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoginForm />
                        <p className="mt-4 text-center text-sm text-muted-foreground">
                            <Link href="/" className="hover:text-primary underline underline-offset-4">
                                Back to home
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}