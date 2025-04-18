"use client";

import { useEffect, useState } from "react";
import { Inspector } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { InspectorUserCard } from "./inspector-user-card";
import { getInspectorWithUser } from "@/lib/actions/user-inspector";

interface ViewInspectorDialogProps {
  inspector: Inspector;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (inspector: Inspector) => void;
  onDelete: (inspector: Inspector) => void;
}

export function ViewInspectorDialog({
  inspector,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ViewInspectorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [inspectorWithUser, setInspectorWithUser] = useState<any>(null);

  // Fetch inspector with user details when dialog opens
  useEffect(() => {
    if (open && inspector.inspectorId) {
      const fetchInspectorDetails = async () => {
        try {
          setLoading(true);
          const data = await getInspectorWithUser(inspector.inspectorId);
          setInspectorWithUser(data);
        } catch (error) {
          console.error("Error fetching inspector details:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchInspectorDetails();
    }
  }, [open, inspector.inspectorId]);

  const handleUserLinked = async () => {
    if (inspector.inspectorId) {
      try {
        const data = await getInspectorWithUser(inspector.inspectorId);
        setInspectorWithUser(data);
      } catch (error) {
        console.error("Error refreshing inspector details:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inspector Details</DialogTitle>
          <DialogDescription>View inspector information</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <Badge variant={inspector.isActive ? "default" : "secondary"}>
                  {inspector.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-base">
                    {inspector.firstName} {inspector.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-base">{inspector.email}</p>
                </div>
              </div>

              {inspector.phoneNumber && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-base">{inspector.phoneNumber}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {inspector.department && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Department
                    </p>
                    <p className="text-base">{inspector.department}</p>
                  </div>
                )}
                {inspector.specialization && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Specialization
                    </p>
                    <p className="text-base">{inspector.specialization}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {inspector.certificationLevel && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Certification Level
                    </p>
                    <p className="text-base">{inspector.certificationLevel}</p>
                  </div>
                )}
                {inspector.yearsOfExperience !== null &&
                  inspector.yearsOfExperience !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Years of Experience
                      </p>
                      <p className="text-base">
                        {inspector.yearsOfExperience}{" "}
                        {inspector.yearsOfExperience === 1 ? "year" : "years"}
                      </p>
                    </div>
                  )}
              </div>

              {inspector.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Notes
                  </p>
                  <p className="text-base whitespace-pre-line">
                    {inspector.notes}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* User Assignment Card */}
            <InspectorUserCard
              inspector={inspectorWithUser || inspector}
              linkedUser={inspectorWithUser?.user}
              onUserLinked={handleUserLinked}
            />

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-base">
                  {inspector.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                <p className="text-base">
                  {inspector.updatedAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            <DialogFooter className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => onEdit(inspector)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(inspector);
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
