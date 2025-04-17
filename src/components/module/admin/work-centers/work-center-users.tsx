"use client";

import { useState } from "react";
import { User, UserStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  UserCircle,
  X,
  Check,
  UserPlus,
  UserMinus,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addUserToWorkCenter,
  removeUserFromWorkCenter,
  updateUserResponsibility,
} from "@/lib/actions/work-center-users";
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

interface WorkCenterUser {
  id: string;
  userId: string;
  workCenterId: string;
  isResponsible: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    profile: {
      firstName: string;
      lastName: string;
      employeeId?: string | null;
      department?: string | null;
      position?: string | null;
    } | null;
  };
}

interface WorkCenterUsersProps {
  workCenterId: string;
  workCenterName: string;
  assignedUsers: WorkCenterUser[];
  availableUsers: User[];
}

export function WorkCenterUsers({
  workCenterId,
  workCenterName,
  assignedUsers,
  availableUsers,
}: WorkCenterUsersProps) {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<WorkCenterUser | null>(null);
  const [isResponsible, setIsResponsible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAddUser = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user to add",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await addUserToWorkCenter(workCenterId, selectedUser, isResponsible);
      toast({
        title: "Success",
        description: "User added to work center successfully",
      });
      setIsAddDialogOpen(false);
      setSelectedUser("");
      setIsResponsible(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add user to work center",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToRemove) return;

    try {
      setIsSubmitting(true);
      await removeUserFromWorkCenter(userToRemove.id);
      toast({
        title: "Success",
        description: "User removed from work center successfully",
      });
      setIsRemoveDialogOpen(false);
      setUserToRemove(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove user from work center",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleResponsibility = async (userWorkCenter: WorkCenterUser) => {
    try {
      await updateUserResponsibility(
        userWorkCenter.id,
        !userWorkCenter.isResponsible
      );
      toast({
        title: "Success",
        description: `User ${
          userWorkCenter.isResponsible ? "is no longer" : "is now"
        } responsible for this work center`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update user responsibility",
        variant: "destructive",
      });
    }
  };

  const getUserFullName = (user: User) => {
    if (user.profile) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user.email;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "WORKER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "INSPECTOR":
        return "bg-green-100 text-green-800 border-green-200";
      case "DELIVERY":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Filter out users with invalid status (if any)
  const filteredAvailableUsers = availableUsers.filter(
    (user) => user.status === "ACTIVE"
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Work Center Users</CardTitle>
            <CardDescription>
              Manage users assigned to {workCenterName}
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add User to Work Center</DialogTitle>
                <DialogDescription>
                  Assign a user to work center "{workCenterName}".
                </DialogDescription>
              </DialogHeader>
              {filteredAvailableUsers.length === 0 ? (
                <div className="py-6 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
                  <h3 className="font-medium text-lg mb-1">
                    No Available Users
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    All active users are already assigned to this work center.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/admin/users")}
                  >
                    Manage Users
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select User</label>
                      <Select
                        value={selectedUser}
                        onValueChange={setSelectedUser}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredAvailableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {getUserFullName(user)} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isResponsible"
                        checked={isResponsible}
                        onChange={(e) => setIsResponsible(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="isResponsible" className="text-sm">
                        Make this user responsible for this work center
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddUser}
                      disabled={isSubmitting || !selectedUser}
                    >
                      {isSubmitting ? "Adding..." : "Add User"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {assignedUsers.length === 0 ? (
            <div className="py-12 text-center">
              <UserCircle className="mx-auto h-16 w-16 text-muted-foreground/60 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Users Assigned</h3>
              <p className="text-muted-foreground mb-6">
                This work center doesn't have any users assigned to it yet.
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="secondary"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Users
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedUsers.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.user.profile
                        ? `${assignment.user.profile.firstName} ${assignment.user.profile.lastName}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{assignment.user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getRoleBadgeColor(assignment.user.role)}
                      >
                        {assignment.user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.user.profile?.department || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleResponsibility(assignment)}
                        title={
                          assignment.isResponsible
                            ? "Remove responsibility"
                            : "Make responsible"
                        }
                      >
                        {assignment.isResponsible ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUserToRemove(assignment);
                          setIsRemoveDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">
                {userToRemove?.user.profile
                  ? `${userToRemove.user.profile.firstName} ${userToRemove.user.profile.lastName}`
                  : userToRemove?.user.email}
              </span>{" "}
              from this work center? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemoveUser();
              }}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
