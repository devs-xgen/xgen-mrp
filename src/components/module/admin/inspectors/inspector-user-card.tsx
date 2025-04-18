"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Inspector } from "@/lib/actions/inspector";
import { User } from "next-auth";
import { unlinkUserFromInspector } from "@/lib/actions/user-inspector";
import { LinkUserDialog } from "./link-user-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserCircle, Link2Icon, Link2Off, Mail } from "lucide-react";

interface InspectorUserCardProps {
  inspector: Inspector;
  linkedUser?: {
    id: string;
    email: string;
    role: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      employeeId?: string;
      department?: string;
      position?: string;
    } | null;
  } | null;
  onUserLinked?: () => Promise<void>;
}

export function InspectorUserCard({
  inspector,
  linkedUser,
  onUserLinked,
}: InspectorUserCardProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUnlinkUser = async () => {
    if (!inspector.inspectorId) return;

    try {
      setIsLoading(true);
      await unlinkUserFromInspector(inspector.inspectorId);

      toast({
        title: "Success",
        description: "User has been unlinked from this inspector",
      });

      setIsUnlinkDialogOpen(false);

      if (onUserLinked) {
        await onUserLinked();
      }

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to unlink user from inspector",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Assignment</h3>
            {linkedUser ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsUnlinkDialogOpen(true)}
                    >
                      <Link2Off className="h-4 w-4 mr-2" />
                      Unlink User
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Remove the association between this inspector and user
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsLinkDialogOpen(true)}
              >
                <Link2Icon className="h-4 w-4 mr-2" />
                Link User
              </Button>
            )}
          </div>

          {linkedUser ? (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-muted rounded-full p-2">
                  <UserCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {linkedUser.profile?.firstName}{" "}
                      {linkedUser.profile?.lastName}
                    </h4>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {linkedUser.role}
                    </Badge>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-3 w-3 mr-1" />
                    {linkedUser.email}
                  </div>

                  {linkedUser.profile?.department && (
                    <p className="text-sm">
                      <span className="font-medium">Department:</span>{" "}
                      {linkedUser.profile.department}
                    </p>
                  )}

                  {linkedUser.profile?.position && (
                    <p className="text-sm">
                      <span className="font-medium">Position:</span>{" "}
                      {linkedUser.profile.position}
                    </p>
                  )}

                  <div className="pt-2">
                    <Link href={`/admin/users/${linkedUser.id}`}>
                      <Button size="sm" variant="ghost">
                        View User Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed rounded-lg p-6 text-center">
              <UserCircle className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
              <h4 className="font-medium text-base mb-1">No User Linked</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This inspector is not linked to any user account. Link a user to
                allow them to perform quality checks.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsLinkDialogOpen(true)}
              >
                <Link2Icon className="h-4 w-4 mr-2" />
                Link User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link User Dialog */}
      <LinkUserDialog
        inspector={inspector}
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        onSuccess={onUserLinked}
      />

      {/* Unlink Confirmation Dialog */}
      <AlertDialog
        open={isUnlinkDialogOpen}
        onOpenChange={setIsUnlinkDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink the user
              <span className="font-semibold"> {linkedUser?.email}</span> from
              this inspector?
              <br />
              <br />
              This will not delete the user account, but they will no longer be
              able to perform quality checks as this inspector.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkUser}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Unlinking..." : "Unlink User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
