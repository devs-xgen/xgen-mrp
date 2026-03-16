import { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordClient } from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your account password",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordClient />
    </Suspense>
  );
}
