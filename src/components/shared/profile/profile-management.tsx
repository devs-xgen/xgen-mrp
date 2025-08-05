"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Shield, AlertCircle, Mail, Phone, MapPin, Briefcase, Calendar, Users, Edit3, X, Check } from "lucide-react";
import { ProfileEditForm } from "./profile-edit-form";
import { PasswordChangeForm } from "./password-change-form";
import { getUserProfile } from "@/lib/actions/shared/profile";
import { UserProfileData } from "@/types/shared/profile";

interface ProfileManagementProps {
  userId?: string; // Optional - if not provided, uses current session user
  showPasswordChange?: boolean; // Whether to show password change tab
  defaultTab?: "profile" | "password"; // Default active tab
  className?: string;
}

export function ProfileManagement({ 
  userId, 
  showPasswordChange = true, 
  defaultTab = "profile",
  className 
}: ProfileManagementProps) {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const targetUserId = userId || session?.user?.id;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!targetUserId) {
        setError("No user ID available");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getUserProfile(targetUserId);
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [targetUserId]);

  const handleProfileUpdate = (updatedUser: UserProfileData) => {
    setUserData(updatedUser);
    setIsEditMode(false); // Exit edit mode after successful update
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last || "U";
  };

  const formatDate = (date?: string | Date | null) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString();
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !userData) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Failed to load user profile"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userData.profile?.avatar || ""} />
              <AvatarFallback className="text-lg">
                {getInitials(userData.profile?.firstName, userData.profile?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">
                  {userData.profile?.firstName && userData.profile?.lastName
                    ? `${userData.profile.firstName} ${userData.profile.lastName}`
                    : "User Profile"}
                </h2>
                <Badge variant="secondary">
                  {formatRole(userData.role)}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {userData.email}
                </div>
                {userData.profile?.phoneNumber && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {userData.profile.phoneNumber}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Details and Management */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className={`grid w-full ${showPasswordChange ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Information
          </TabsTrigger>
          {showPasswordChange && (
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Overview</CardTitle>
                  <CardDescription>
                    Your personal and professional information
                  </CardDescription>
                </div>
                <Button
                  variant={isEditMode ? "outline" : "default"}
                  size="sm"
                  onClick={toggleEditMode}
                  className="flex items-center gap-2"
                >
                  {isEditMode ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditMode ? (
                /* Edit Mode - Show Profile Edit Form */
                <ProfileEditForm 
                  user={userData} 
                  onSuccess={handleProfileUpdate}
                />
              ) : (
                /* View Mode - Show Profile Details */
                <>
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Date of Birth:</span>
                        <span className="ml-2">{formatDate(userData.profile?.dateOfBirth)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span>
                        <span className="ml-2">{userData.profile?.gender || "Not specified"}</span>
                      </div>
                    </div>
                    {userData.profile?.bio && (
                      <div>
                        <span className="font-medium text-sm">Bio:</span>
                        <p className="mt-1 text-sm text-muted-foreground">{userData.profile.bio}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Address Information */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address Information
                    </h4>
                    <div className="text-sm space-y-1">
                      {userData.profile?.address && (
                        <div>{userData.profile.address}</div>
                      )}
                      <div className="flex gap-2">
                        {userData.profile?.city && <span>{userData.profile.city},</span>}
                        {userData.profile?.state && <span>{userData.profile.state}</span>}
                        {userData.profile?.postalCode && <span>{userData.profile.postalCode}</span>}
                      </div>
                      {userData.profile?.country && (
                        <div>{userData.profile.country}</div>
                      )}
                      {!userData.profile?.address && !userData.profile?.city && (
                        <span className="text-muted-foreground">No address information provided</span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Work Information */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Work Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Employee ID:</span>
                        <span className="ml-2">{userData.profile?.employeeId || "Not assigned"}</span>
                      </div>
                      <div>
                        <span className="font-medium">Department:</span>
                        <span className="ml-2">{userData.profile?.department || "Not specified"}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium">Position:</span>
                        <span className="ml-2">{userData.profile?.position || "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Work Center Assignments */}
                  {userData.workCenterAssignments && userData.workCenterAssignments.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Work Center Assignments
                        </h4>
                        <div className="space-y-2">
                          {userData.workCenterAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center gap-2">
                              <Badge variant={assignment.isPrimary ? "default" : "secondary"}>
                                {assignment.workCenter.name}
                              </Badge>
                              {assignment.isPrimary && (
                                <span className="text-xs text-muted-foreground">(Primary)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Account Information */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Account Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Member Since:</span>
                        <span className="ml-2">{formatDate(userData.createdAt)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Last Login:</span>
                        <span className="ml-2">{formatDate(userData.lastLoginAt)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>


        </TabsContent>

        {showPasswordChange && (
          <TabsContent value="password">
            <PasswordChangeForm 
              userId={userData.id}
              onSuccess={() => {
                // Optionally refresh user data or show success message
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}