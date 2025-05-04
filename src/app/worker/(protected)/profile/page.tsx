// src/app/worker/(protected)/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { getUserProfile } from "@/lib/actions/worker/profile";
import { Button } from "@/components/ui/button";
import { UserProfileData } from "@/types/worker/profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarIcon, Clock, Phone, Mail, MapPin, BadgeCheck, Award, BriefcaseBusiness, Shield, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PasswordChangeForm } from "@/components/module/worker/profile/password-change-form";
import { ProfileEditForm } from "@/components/module/worker/profile/profile-edit-form";

// Helper functions for type-safe status checks
type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';
const isLoading = (status: SessionStatus): boolean => status === 'loading';
const isAuthenticated = (status: SessionStatus): boolean => status === 'authenticated';
const isUnauthenticated = (status: SessionStatus): boolean => status === 'unauthenticated';

// Format a date with fallback
const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return "Not set";
  try {
    return format(new Date(date), "MMMM d, yyyy");
  } catch (e) {
    return "Invalid date";
  }
};

export default function ProfilePage() {
  const { data: session, status } = useSession({ required: true });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Manual fetch for debugging
  const manualFetch = async () => {
    if (!session?.user?.id) {
      setDebugInfo({ error: "No session ID available" });
      return;
    }
    
    setIsLoadingData(true);
    setError(null);
    
    try {
      console.log("Manual fetch attempt with ID:", session.user.id);
      const user = await getUserProfile(session.user.id);
      setUserData(user as unknown as UserProfileData);
      setDebugInfo({ success: true, message: "Manual fetch successful", data: user });
    } catch (err: any) {
      console.error("Manual fetch error:", err);
      setError(`Failed to fetch: ${err.message}`);
      setDebugInfo({ error: err.message });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleProfileUpdateSuccess = async () => {
    setIsEditingProfile(false);
    if (session?.user?.id) {
      setIsLoadingData(true);
      try {
        const updatedUser = await getUserProfile(session.user.id);
        setUserData(updatedUser as unknown as UserProfileData);
      } catch (error) {
        console.error("Error refreshing user data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }
  };

  useEffect(() => {
    // Don't attempt to fetch until we know the session status
    if (isLoading(status as SessionStatus)) {
      return;
    }
    
    setSessionChecked(true);
    
    const fetchUserData = async () => {
      if (!session?.user?.id) {
        console.log("No user session found. Session:", session);
        console.log("Session status:", status);
        setIsLoadingData(false);
        
        // Only set error if we've definitely checked the session and it's not available
        if (isUnauthenticated(status as SessionStatus)) {
          setError("You must be logged in to view your profile.");
        }
        return;
      }

      try {
        console.log("Fetching user data for ID:", session.user.id);
        const user = await getUserProfile(session.user.id);
        console.log("User data received:", user);
        setUserData(user as unknown as UserProfileData);
      } catch (err: any) {
        console.error("Error fetching user data:", err);
        setError(`Failed to load user data: ${err.message}`);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isAuthenticated(status as SessionStatus) && session?.user?.id) {
      fetchUserData();
    } else if (isUnauthenticated(status as SessionStatus)) {
      setIsLoadingData(false);
      setError("You must be logged in to view your profile.");
    }
  }, [session, status]);

  // Show loading state while session is still loading
  if (isLoading(status as SessionStatus) || (isLoadingData && !sessionChecked)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile data...</p>
        </div>
      </div>
    );
  }

  // Show login message only if we've confirmed there's no session
  if (isUnauthenticated(status as SessionStatus) && sessionChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Debug log
  console.log("Rendering profile with user data:", userData, "Session status:", status, "Session user:", session?.user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">
          View and manage your account information
        </p>
      </div>

      {error ? (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
          <p>{error}</p>
          <Button 
            onClick={manualFetch} 
            className="mt-4"
            variant="outline"
            size="sm"
          >
            Try Manual Fetch
          </Button>
        </div>
      ) : !userData ? (
        <div className="p-4 text-center border rounded-md">
          <p>No profile data available.</p>
          <Button 
            onClick={manualFetch} 
            className="mt-4"
            variant="outline"
          >
            Try Manual Fetch
          </Button>
        </div>
      ) : (
        <>
          {/* Profile header card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar className="h-24 w-24 border-2 border-primary/10">
                  {userData.profile?.avatar ? (
                    <AvatarImage src={userData.profile.avatar} alt="Profile photo" />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {userData.profile?.firstName?.[0] || ''}
                      {userData.profile?.lastName?.[0] || ''}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold">
                    {userData.profile?.firstName || ''} {userData.profile?.lastName || ''}
                    <Badge className="ml-2" variant={userData.status === "ACTIVE" ? "default" : "secondary"}>
                      {userData.status}
                    </Badge>
                  </h3>
                  <div className="text-muted-foreground flex flex-col sm:flex-row gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{userData.email}</span>
                    </div>
                    {userData.profile?.phoneNumber && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{userData.profile.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <BadgeCheck className="h-3 w-3" /> {userData.role}
                    </Badge>
                    {userData.profile?.department && (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <BriefcaseBusiness className="h-3 w-3" /> {userData.profile.department}
                      </Badge>
                    )}
                    {userData.profile?.position && (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <Award className="h-3 w-3" /> {userData.profile.position}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs card */}
          <Card>
            <CardHeader>
              <Tabs defaultValue="personal">
                <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="work">Work Details</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
                  <TabsTrigger value="tasks">Assigned Tasks</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
              
                <TabsContent value="personal" className="mt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <CardDescription>Your personal information details</CardDescription>
                    
                    {!isEditingProfile ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>

                  {isEditingProfile && session?.user?.id ? (
                    <ProfileEditForm 
                      userId={session.user.id}
                      userData={userData}
                      onUpdateSuccess={handleProfileUpdateSuccess}
                    />
                  ) : (
                    <>
                      <div className="space-y-1">
                        <h4 className="font-medium">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">First Name</p>
                            <p>{userData.profile?.firstName || "Not set"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                            <p>{userData.profile?.lastName || "Not set"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p>{userData.email}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                            <p>{userData.profile?.phoneNumber || "Not set"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                            <p>{userData.profile?.dateOfBirth ? formatDate(userData.profile.dateOfBirth) : "Not set"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Gender</p>
                            <p>{userData.profile?.gender || "Not set"}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1">
                        <h4 className="font-medium">Address</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Street Address</p>
                            <p>{userData.profile?.address || "Not set"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">City</p>
                            <p>{userData.profile?.city || "Not set"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">State/Province</p>
                            <p>{userData.profile?.state || "Not set"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Country</p>
                            <p>{userData.profile?.country || "Not set"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Postal Code</p>
                            <p>{userData.profile?.postalCode || "Not set"}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="work" className="mt-4 space-y-4">
                  <CardDescription>Your work-related information</CardDescription>
                  
                  <div className="space-y-1">
                    <h4 className="font-medium">Employment Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Position</p>
                        <p>{userData.profile?.position || "Not set"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Department</p>
                        <p>{userData.profile?.department || "Not set"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                        <p>{userData.profile?.employeeId || "Not set"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Joined Date</p>
                        <p>{formatDate(userData.createdAt)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                        <p>{userData.lastLoginAt ? formatDate(userData.lastLoginAt) : "Not available"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <p>{userData.status}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Assigned Work Centers</h4>
                    {(userData.workCenterAssignments?.length || 0) > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {userData.workCenterAssignments?.map((assignment, index) => (
                          <div key={index} className="bg-muted p-3 rounded-md flex justify-between items-center">
                            <div>
                              <p className="font-medium">{assignment.workCenter.name}</p>
                              {assignment.workCenter.description && (
                                <p className="text-sm text-muted-foreground">{assignment.workCenter.description}</p>
                              )}
                            </div>
                            {assignment.isPrimary && (
                              <Badge className="ml-2">Primary</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No work centers assigned</p>
                    )}
                  </div>

                  {userData.UserWorkCenter && userData.UserWorkCenter.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium">Responsible For Work Centers</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {userData.UserWorkCenter.map((userWorkCenter, index) => (
                            <div key={index} className="bg-muted p-3 rounded-md flex justify-between items-center">
                              <div>
                                <p className="font-medium">{userWorkCenter.workCenter.name}</p>
                                {userWorkCenter.workCenter.description && (
                                  <p className="text-sm text-muted-foreground">{userWorkCenter.workCenter.description}</p>
                                )}
                              </div>
                              {userWorkCenter.isResponsible && (
                                <Badge variant="secondary" className="ml-2">Responsible</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="emergency" className="mt-4 space-y-4">
                  <CardDescription>Emergency contact information</CardDescription>

                  {userData.profile?.emergencyContact ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p>{userData.profile.emergencyContact.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Relationship</p>
                        <p>{userData.profile.emergencyContact.relationship}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                        <p className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {userData.profile.emergencyContact.phoneNumber}
                        </p>
                      </div>
                      {userData.profile.emergencyContact.altPhoneNumber && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Alternative Phone</p>
                          <p className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {userData.profile.emergencyContact.altPhoneNumber}
                          </p>
                        </div>
                      )}
                      {userData.profile.emergencyContact.email && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <p className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {userData.profile.emergencyContact.email}
                          </p>
                        </div>
                      )}
                      {userData.profile.emergencyContact.address && (
                        <div className="md:col-span-2 space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Address</p>
                          <p className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {userData.profile.emergencyContact.address}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-center">No emergency contact information available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="mt-4 space-y-4">
                  <CardDescription>Your current assigned tasks</CardDescription>

                  {userData.assignedOperations && userData.assignedOperations.length > 0 ? (
                    <div className="space-y-3">
                      {userData.assignedOperations.map((operation, index) => (
                        <div key={index} className="border rounded-md p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">
                                {operation.productionOrder.product.name}
                                <span className="text-xs ml-2 text-muted-foreground">
                                  {operation.productionOrder.product.sku}
                                </span>
                              </h4>
                              <p className="text-sm">Work Center: {operation.workCenter.name}</p>
                            </div>
                            <Badge variant={
                              operation.status === "PENDING" ? "outline" :
                              operation.status === "IN_PROGRESS" ? "secondary" :
                              "default"
                            }>
                              {operation.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              <span>Start: {formatDate(operation.startTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Due: {formatDate(operation.endTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BadgeCheck className="h-3 w-3" />
                              <span>Priority: {operation.productionOrder.priority}</span>
                            </div>
                          </div>
                          {operation.notes && (
                            <p className="text-sm bg-muted p-2 rounded-md">{operation.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-center">No tasks currently assigned</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="security" className="mt-4 space-y-4">
                  <CardDescription>Update your password and security settings</CardDescription>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-4">
                        <Shield className="h-4 w-4" /> 
                        Password Management
                      </h4>
                      
                      {session?.user?.id ? (
                        <PasswordChangeForm userId={session.user.id} />
                      ) : (
                        <div className="p-4 bg-muted rounded-md">
                          <p className="text-center">Unable to load password form - session information unavailable</p>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Account Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                          <div>
                            <p className="font-medium">Last Password Change</p>
                            <p className="text-sm text-muted-foreground">
                              {userData.updatedAt ? formatDate(userData.updatedAt) : "Not available"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                          <div>
                            <p className="font-medium">Account Created</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(userData.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                          <div>
                            <p className="font-medium">Last Login</p>
                            <p className="text-sm text-muted-foreground">
                              {userData.lastLoginAt ? formatDate(userData.lastLoginAt) : "Not available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </>
      )}

      {/* Debug information card - only show in development */}
      {process.env.NODE_ENV !== "production" && (
        <Card className="border-dashed border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <div className="space-y-1">
              <div>Session Status: {status}</div>
              <div>Session User ID: {session?.user?.id || "No ID available"}</div>
              <div>Session User Email: {session?.user?.email || "No email available"}</div>
              <div>Session User Role: {session?.user?.role || "No role available"}</div>
              <div>Session Checked: {sessionChecked ? "Yes" : "No"}</div>
              <div>Is Loading: {isLoadingData ? "Yes" : "No"}</div>
              {debugInfo && (
                <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted p-2 rounded-md overflow-auto max-h-80">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
