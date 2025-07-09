import { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/global/login/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
    title: "Worker Login",
    description: "Login to access the worker dashboard",
}

export default function WorkerLoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md mx-auto">
                <Card>
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Worker Login</CardTitle>
                        <CardDescription>
                            Enter your credentials to access the worker dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoginForm />
                        <div className="mt-6 text-center">
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to home
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}