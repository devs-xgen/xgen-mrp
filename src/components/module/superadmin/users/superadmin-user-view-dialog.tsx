"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { UserData } from "@/types/admin/user";
import { formatDateTime } from "@/components/global/table";

interface SuperAdminUserViewDialogProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (user: UserData) => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

export function SuperAdminUserViewDialog({
  user,
  open,
  onOpenChange,
  onEdit,
}: SuperAdminUserViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
          <DialogDescription>
            Full profile information for {user?.email ?? "selected user"}.
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow
                  label="Full name"
                  value={`${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim() || "—"}
                />
                <InfoRow label="Email" value={user.email} />
                <InfoRow
                  label="Role"
                  value={
                    <Badge variant="outline" className="uppercase tracking-wide">
                      {user.role
                        .replaceAll("_", " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    <Badge
                      variant={
                        user.status === "ACTIVE"
                          ? "secondary"
                          : user.status === "SUSPENDED"
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {user.status.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  }
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Employee ID" value={user.profile?.employeeId ?? "—"} />
                <InfoRow label="Department" value={user.profile?.department ?? "—"} />
                <InfoRow label="Position" value={user.profile?.position ?? "—"} />
                <InfoRow label="Phone number" value={user.profile?.phoneNumber ?? "—"} />
                <InfoRow label="City" value={user.profile?.city ?? "—"} />
                <InfoRow label="Country" value={user.profile?.country ?? "—"} />
              </div>

              {user.role === "INSPECTOR" && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <div className="text-sm font-semibold">Inspector details</div>
                    <div className="text-xs text-muted-foreground">
                      Manage the inspector profile linked to this user.
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Inspector ID" value={user.inspector?.inspectorId ?? "—"} />
                    <InfoRow label="Phone" value={user.inspector?.phoneNumber ?? "—"} />
                    <InfoRow label="Department" value={user.inspector?.department ?? user.profile?.department ?? "—"} />
                    <InfoRow label="Specialization" value={user.inspector?.specialization ?? "—"} />
                    <InfoRow label="Certification level" value={user.inspector?.certificationLevel ?? "—"} />
                    <InfoRow label="Years of experience" value={user.inspector?.yearsOfExperience ?? "—"} />
                    <InfoRow
                      label="Active"
                      value={
                        user.inspector
                          ? user.inspector.isActive
                            ? "Yes"
                            : "No"
                          : "—"
                      }
                    />
                    <InfoRow label="Notes" value={user.inspector?.notes ?? "—"} />
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Created at" value={formatDateTime(user.createdAt)} />
                <InfoRow label="Last login" value={formatDateTime(user.lastLoginAt)} />
                <InfoRow label="Updated at" value={formatDateTime(user.updatedAt)} />
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-sm text-muted-foreground">Select a user to view details.</div>
        )}

        {user && onEdit && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onEdit(user)}>
              Edit user
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
