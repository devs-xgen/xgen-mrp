import { Metadata } from "next"
import Link from "next/link"

import { LoginForm } from "@/components/global/login/login-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Developer Login",
  description: "Login to access the developer portal",
}

export default function DeveloperLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Developer Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the developer tools and dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-3 text-center text-sm text-muted-foreground">
              Need to access the admin portal instead?{" "}
              <Link href="/admin/login" className="text-primary hover:underline">
                go to admin login
              </Link>
            </div>
            <div className="mt-6 text-center">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                >
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
