// src/app/worker/(protected)/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getUserProfile } from "@/lib/actions/worker/profile";
import { Button } from "@/components/ui/button";
import { UserProfileData } from "@/types/worker/profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  BadgeCheck, 
  Award, 
  BriefcaseBusiness, 
  Shield, 
  Pencil, 
  X, 
  User, 
  Building, 
  AlertCircle,
  CheckCircle,
  Settings,
  UserCheck,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PasswordChangeForm } from "@/components/module/worker/profile/password-change-form";
import { ProfileEditForm } from "@/components/module/worker/profile/profile-edit-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

// Get status badge variant
const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'default';
    case 'pending': return 'secondary';
    case 'in_progress': return 'secondary';
    case 'completed': return 'default';
    default: return 'outline';
  }
};

// Get priority badge variant
const getPriorityBadgeVariant = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'urgent': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Loading Profile</h3>
            <p className="text-muted-foreground">Please wait while we fetch your profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login message only if we've confirmed there's no session
  if (isUnauthenticated(status as SessionStatus) && sessionChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Debug log
  console.log("Rendering profile with user data:", userData, "Session status:", status, "Session user:", session?.user);

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage your account information and settings
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              onClick={manualFetch} 
              variant="outline"
              size="sm"
              className="ml-4"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : !userData ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No profile data available.</span>
            <Button 
              onClick={manualFetch} 
              variant="outline"
              size="sm"
              className="ml-4"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Load Profile
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Profile Header Card */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-lg">
                    {userData.profile?.avatar ? (
                      <AvatarImage src={userData.profile.avatar} alt="Profile photo" />
                    ) : (
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                        {userData.profile?.firstName?.[0] || ''}
                        {userData.profile?.lastName?.[0] || ''}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <h2 className="text-3xl font-bold">
                        {userData.profile?.firstName || ''} {userData.profile?.lastName || ''}
                      </h2>
                      <Badge 
                        className="w-fit" 
                        variant={userData.status === "ACTIVE" ? "default" : "secondary"}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {userData.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{userData.email}</span>
                      </div>
                      {userData.profile?.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{userData.profile.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role and Department Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" /> 
                      {userData.role}
                    </Badge>
                    {userData.profile?.department && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Building className="h-3 w-3" /> 
                        {userData.profile.department}
                      </Badge>
                    )}
                    {userData.profile?.position && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Award className="h-3 w-3" /> 
                        {userData.profile.position}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-0">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto p-1">
                  <TabsTrigger value="personal" className="flex items-center gap-2 py-3">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Personal</span>
                  </TabsTrigger>
                  <TabsTrigger value="work" className="flex items-center gap-2 py-3">
                    <BriefcaseBusiness className="h-4 w-4" />
                    <span className="hidden sm:inline">Work</span>
                  </TabsTrigger>
                  <TabsTrigger value="emergency" className="flex items-center gap-2 py-3">
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Emergency</span>
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex items-center gap-2 py-3">
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">Tasks</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2 py-3">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Security</span>
                  </TabsTrigger>
                </TabsList>
              
                {/* Personal Information Tab */}
                <TabsContent value="personal" className="mt-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                      <p className="text-muted-foreground">Your personal details and contact information</p>
                    </div>
                    
                    {!isEditingProfile ? (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingProfile(true)}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingProfile(false)}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
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
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">First Name</label>
                              <p className="text-sm">{userData.profile?.firstName || "Not set"}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                              <p className="text-sm">{userData.profile?.lastName || "Not set"}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Email</label>
                              <p className="text-sm">{userData.email}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                              <p className="text-sm">{userData.profile?.phoneNumber || "Not set"}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                              <p className="text-sm">{userData.profile?.dateOfBirth ? formatDate(userData.profile.dateOfBirth) : "Not set"}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Gender</label>
                              <p className="text-sm">{userData.profile?.gender || "Not set"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Address Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Address Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Street Address</label>
                              <p className="text-sm">{userData.profile?.address || "Not set"}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">City</label>
                              <p className="text-sm">{userData.profile?.city || "Not set"}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">State/Province</label>
                              <p className="text-sm">{userData.profile?.state || "Not set"}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Country</label>
                              <p className="text-sm">{userData.profile?.country || "Not set"}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Postal Code</label>
                              <p className="text-sm">{userData.profile?.postalCode || "Not set"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Work Information Tab */}
                <TabsContent value="work" className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Work Information</h3>
                    <p className="text-muted-foreground">Your employment details and work center assignments</p>
                  </div>
                  
                  {/* Employment Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Position</label>
                          <p className="text-sm">{userData.profile?.position || "Not set"}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Department</label>
                          <p className="text-sm">{userData.profile?.department || "Not set"}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                          <p className="text-sm">{userData.profile?.employeeId || "Not set"}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Join Date</label>
                          <p className="text-sm">{formatDate(userData.createdAt)}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                          <p className="text-sm">{userData.lastLoginAt ? formatDate(userData.lastLoginAt) : "Not available"}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <Badge variant={getStatusBadgeVariant(userData.status)}>
                            {userData.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Work Center Assignments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Work Center Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(userData.workCenterAssignments?.length || 0) > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userData.workCenterAssignments?.map((assignment, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{assignment.workCenter.name}</h4>
                                  {assignment.workCenter.description && (
                                    <p className="text-sm text-muted-foreground">{assignment.workCenter.description}</p>
                                  )}
                                </div>
                                {assignment.isPrimary && (
                                  <Badge variant="default" className="text-xs">Primary</Badge>
                                )}
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Capacity: {assignment.workCenter.capacityPerHour || 0}/hr</span>
                                <span>Hours: {assignment.workCenter.operatingHours || 0}</span>
                                <span>Efficiency: {assignment.workCenter.efficiencyRate || 0}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No work centers assigned</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Responsible Work Centers */}
                  {userData.UserWorkCenter && userData.UserWorkCenter.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Responsible Work Centers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userData.UserWorkCenter.map((userWorkCenter, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{userWorkCenter.workCenter.name}</h4>
                                  {userWorkCenter.workCenter.description && (
                                    <p className="text-sm text-muted-foreground">{userWorkCenter.workCenter.description}</p>
                                  )}
                                </div>
                                {userWorkCenter.isResponsible && (
                                  <Badge variant="secondary" className="text-xs">Responsible</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Emergency Contact Tab */}
                <TabsContent value="emergency" className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Emergency Contact</h3>
                    <p className="text-muted-foreground">Emergency contact information for urgent situations</p>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      {userData.profile?.emergencyContact ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-sm">{userData.profile.emergencyContact.name}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                            <p className="text-sm">{userData.profile.emergencyContact.relationship}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                            <p className="text-sm flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {userData.profile.emergencyContact.phoneNumber}
                            </p>
                          </div>
                          {userData.profile.emergencyContact.altPhoneNumber && (
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Alternative Phone</label>
                              <p className="text-sm flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {userData.profile.emergencyContact.altPhoneNumber}
                              </p>
                            </div>
                          )}
                          {userData.profile.emergencyContact.email && (
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Email</label>
                              <p className="text-sm flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {userData.profile.emergencyContact.email}
                              </p>
                            </div>
                          )}
                          {userData.profile.emergencyContact.address && (
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">Address</label>
                              <p className="text-sm flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {userData.profile.emergencyContact.address}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No emergency contact information available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Assigned Tasks</h3>
                    <p className="text-muted-foreground">Your current assigned operations and tasks</p>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      {userData.assignedOperations && userData.assignedOperations.length > 0 ? (
                        <div className="space-y-4">
                          {userData.assignedOperations.map((operation, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h4 className="font-medium">
                                    {operation.productionOrder.product.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    SKU: {operation.productionOrder.product.sku}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Work Center: {operation.workCenter.name}
                                  </p>
                                </div>
                                <Badge variant={getStatusBadgeVariant(operation.status)}>
                                  {operation.status}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>Start: {formatDate(operation.startTime)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>Due: {formatDate(operation.endTime)}</span>
                                </div>
                                <Badge variant={getPriorityBadgeVariant(operation.productionOrder.priority)}>
                                  {operation.productionOrder.priority}
                                </Badge>
                              </div>
                              
                              {operation.notes && (
                                <div className="bg-muted p-3 rounded-md">
                                  <p className="text-sm">{operation.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No tasks currently assigned</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Security Tab */}
                <TabsContent value="security" className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Security Settings</h3>
                    <p className="text-muted-foreground">Manage your password and security preferences</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Password Management */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4" /> 
                          Password Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {session?.user?.id ? (
                          <PasswordChangeForm userId={session.user.id} />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Unable to load password form - session information unavailable</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Account Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Account Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">Last Password Change</p>
                              <p className="text-sm text-muted-foreground">
                                {userData.updatedAt ? formatDate(userData.updatedAt) : "Not available"}
                              </p>
                            </div>
                            <Settings className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">Account Created</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(userData.createdAt)}
                              </p>
                            </div>
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">Last Login</p>
                              <p className="text-sm text-muted-foreground">
                                {userData.lastLoginAt ? formatDate(userData.lastLoginAt) : "Not available"}
                              </p>
                            </div>
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </>
      )}

      {/* Debug information card - only show in development */}
      {process.env.NODE_ENV !== "production" && debugInfo && (
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
              <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted p-2 rounded-md overflow-auto max-h-80">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
