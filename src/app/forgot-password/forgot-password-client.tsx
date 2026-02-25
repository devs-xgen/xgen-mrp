"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowLeft, CheckCircle, EyeIcon, EyeOffIcon, Loader2, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { findUserByEmail, resetPassword } from "@/lib/actions/auth"

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
})

const resetSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
})

type Step = "email" | "reset" | "success"

export function ForgotPasswordClient() {
  const [step, setStep] = useState<Step>("email")
  const [confirmedEmail, setConfirmedEmail] = useState("")
  const [userRole, setUserRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  })

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    setIsLoading(true)
    setError("")
    try {
      const result = await findUserByEmail(values.email)
      if (!result.success) {
        setError(result.error ?? "An error occurred.")
        return
      }
      setConfirmedEmail(values.email)
      setUserRole(result.data?.role ?? "")
      setStep("reset")
    } finally {
      setIsLoading(false)
    }
  }

  async function onResetSubmit(values: z.infer<typeof resetSchema>) {
    setIsLoading(true)
    setError("")
    try {
      const result = await resetPassword({
        email: confirmedEmail,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      if (!result.success) {
        setError(result.error ?? "An error occurred.")
        return
      }
      setStep("success")
    } finally {
      setIsLoading(false)
    }
  }

  const getLoginHref = () => {
    const role = userRole.toLowerCase()
    if (role === "super_admin") return "/superadmin/login"
    if (role === "admin") return "/admin/login"
    if (role === "worker") return "/worker/login"
    if (role === "inspector") return "/inspector/login"
    if (role === "delivery") return "/delivery/login"
    if (role === "developer") return "/developer/login"
    return "/admin/login"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full bg-primary/10">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === "email" && "Forgot Password"}
              {step === "reset" && "Set New Password"}
              {step === "success" && "Password Updated"}
            </CardTitle>
            <CardDescription>
              {step === "email" && "Enter your account email to continue"}
              {step === "reset" && (
                <>
                  Setting new password for{" "}
                  <span className="font-medium text-foreground">{confirmedEmail}</span>
                </>
              )}
              {step === "success" && "Your password has been changed successfully"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1 — Email lookup */}
            {step === "email" && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            type="email"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Looking up account...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {/* Step 2 — New password */}
            {step === "reset" && (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              disabled={isLoading}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOffIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm new password"
                              disabled={isLoading}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOffIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => { setStep("email"); setError("") }}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 3 — Success */}
            {step === "success" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-2">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <p className="text-sm text-muted-foreground text-center">
                    You can now sign in with your new password.
                  </p>
                </div>
                <Link href={getLoginHref()}>
                  <Button className="w-full">Go to Login</Button>
                </Link>
              </div>
            )}

            {/* Back to home link */}
            {step !== "success" && (
              <div className="text-center">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to home
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {step === "email" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Note: This is a simplified password reset. No email verification is required.
          </p>
        )}
      </div>
    </div>
  )
}
