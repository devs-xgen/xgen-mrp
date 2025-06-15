"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { updateInspectorPassword, canInspectorChangePassword } from "@/lib/actions/inspector/profile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Clock, Lock } from "lucide-react";
import { InspectorPasswordChangeData, inspectorPasswordChangeSchema } from "@/types/inspector/profile";
import { format } from "date-fns";

const formSchema = inspectorPasswordChangeSchema;

interface InspectorPasswordChangeFormProps {
  userId: string;
}

export function InspectorPasswordChangeForm({ userId }: InspectorPasswordChangeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPasswords, setShowNewPasswords] = useState(false);
  const [canChange, setCanChange] = useState<boolean>(true);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [lastChanged, setLastChanged] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InspectorPasswordChangeData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function checkEligibility() {
      try {
        setIsCheckingEligibility(true);
        const result = await canInspectorChangePassword(userId);
        setCanChange(result.canChange);
        setWarningMsg(result.message);
        setDaysRemaining(result.daysRemaining ?? null);
        setLastChanged(result.lastChanged ? new Date(result.lastChanged) : null);
      } catch (err) {
        console.error("Error checking password eligibility:", err);
        setCanChange(true);
      } finally {
        setIsCheckingEligibility(false);
      }
    }

    if (userId) {
      checkEligibility();
    }
  }, [userId]);

  const onSubmit = async (data: InspectorPasswordChangeData) => {
    if (!canChange) {
      setErrorMsg(warningMsg || "You cannot change your password at this time.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await updateInspectorPassword(userId, data);

      if (result.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });

        reset();
        setCanChange(false);
        setWarningMsg("Password can only be changed once every 30 days.");
        setDaysRemaining(30);
        setLastChanged(new Date());
      } else {
        setErrorMsg(typeof result.error === "string" ? result.error : "Failed to update password.");

        toast({
          title: "Error",
          description: typeof result.error === "string" ? result.error : "Failed to update password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setErrorMsg("An unexpected error occurred.");

      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingEligibility) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mr-3"></div>
        <p>Checking password status...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMsg && (
        <Alert variant="destructive" className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {!canChange && (
        <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800 flex items-center space-x-2">
          <Lock className="h-4 w-4" />
          <AlertTitle>Password Change Restricted</AlertTitle>
          <AlertDescription>
            <p>{warningMsg}</p>
            {lastChanged && (
              <p className="mt-1 text-sm">Last changed: {format(lastChanged, "MMMM d, yyyy")}</p>
            )}
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="flex items-center mt-2 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                <span>Days remaining: {daysRemaining}</span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="relative">
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              {...register("currentPassword")}
              className={errors.currentPassword ? "border-red-500 pr-10" : "pr-10"}
              disabled={!canChange || isLoading}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              disabled={!canChange || isLoading}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
          )}
        </div>

        <div className="relative">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPasswords ? "text" : "password"}
              {...register("newPassword")}
              className={errors.newPassword ? "border-red-500 pr-10" : "pr-10"}
              disabled={!canChange || isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPasswords(!showNewPasswords)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              disabled={!canChange || isLoading}
            >
              {showNewPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="relative">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showNewPasswords ? "text" : "password"}
              {...register("confirmPassword")}
              className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
              disabled={!canChange || isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPasswords(!showNewPasswords)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              disabled={!canChange || isLoading}
            >
              {showNewPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Password requirements:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>At least 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
            <li>Can only be changed once every 30 days</li>
          </ul>
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !canChange}>
          {isLoading ? "Updating..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
