"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getAvailableUsers,
  linkUserToInspector,
} from "@/lib/actions/user-inspector";
import { Inspector } from "@/lib/actions/inspector";
import { LinkIcon } from "lucide-react";

// Define an interface that matches the structure returned by getAvailableUsers
interface DatabaseUser {
  id: string;
  email: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
  } | null;
}

interface LinkUserDialogProps {
  inspector: Inspector;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function LinkUserDialog({
  inspector,
  open,
  onOpenChange,
  onSuccess,
}: LinkUserDialogProps) {
  const [availableUsers, setAvailableUsers] = useState<DatabaseUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch available users when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableUsers();
    }
  }, [open]);

  const fetchAvailableUsers = async () => {
    try {
      setIsLoading(true);
      const users = await getAvailableUsers();
      setAvailableUsers(users);
      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load available users"
      );
      setIsLoading(false);
    }
  };

  const handleLinkUser = async () => {
    if (!selectedUserId) {
      setError("Please select a user to link");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await linkUserToInspector(selectedUserId, inspector.inspectorId);

      toast({
        title: "Success",
        description: "User has been linked to this inspector",
      });

      onOpenChange(false);
      setSelectedUserId("");

      if (onSuccess) {
        await onSuccess();
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to link user to inspector"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDisplayName = (user: DatabaseUser) => {
    if (user.profile && user.profile.firstName && user.profile.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName} (${user.email})`;
    }
    return user.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link User to Inspector</DialogTitle>
          <DialogDescription>
            Link an existing user to the inspector "{inspector.firstName}{" "}
            {inspector.lastName}"
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center p-4">
              <div className="mb-4">
                <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto" />
              </div>
              <h3 className="font-medium text-lg mb-2">No Available Users</h3>
              <p className="text-muted-foreground mb-4">
                There are no available users that can be linked to this
                inspector. All users are already linked to inspectors or there
                are no active users.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/users")}
              >
                Manage Users
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Select a user to link" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Linking a user will set their role to INSPECTOR and allow them
                to perform quality checks.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLinkUser}
            disabled={
              isLoading || !selectedUserId || availableUsers.length === 0
            }
          >
            {isLoading ? "Linking..." : "Link User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
