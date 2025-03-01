// src/app/worker/(protected)/profile/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const { data: session } = useSession();

  // Sample user profile data
  const [userProfile, setUserProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: session?.user?.email || "john.doe@example.com",
    phone: "+1234567890",
    position: "Production Operator",
    department: "Manufacturing",
    employeeId: "EMP-2023-001",
    joinedDate: "March 15, 2022",
    address: "123 Worker Street, Industrial Zone",
    city: "Manufacturing City",
    state: "Production State",
    country: "Operations Country",
    postalCode: "12345",
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleProfileUpdate = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
    });
  };

  const handlePasswordChange = () => {
    if (password.new !== password.confirm) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.new.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    });

    setPassword({
      current: "",
      new: "",
      confirm: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">
          Manage your account settings and information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="md:col-span-4">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>
                  {userProfile.firstName.charAt(0)}
                  {userProfile.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-bold">
                  {userProfile.firstName} {userProfile.lastName}
                </h3>
                <p className="text-muted-foreground">
                  {userProfile.position} • {userProfile.department}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="work">Work Details</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userProfile.firstName}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userProfile.lastName}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          email: e.target.value,
                        })
                      }
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={userProfile.phone}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate}>Save Changes</Button>
                </div>
              </TabsContent>

              <TabsContent value="work" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={userProfile.position}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          position: e.target.value,
                        })
                      }
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={userProfile.department}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          department: e.target.value,
                        })
                      }
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={userProfile.employeeId}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          employeeId: e.target.value,
                        })
                      }
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="joinedDate">Joined Date</Label>
                    <Input
                      id="joinedDate"
                      value={userProfile.joinedDate}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          joinedDate: e.target.value,
                        })
                      }
                      disabled
                    />
                  </div>
                </div>
                <div className="pt-2 text-sm text-muted-foreground">
                  Work details can only be modified by administrators.
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={userProfile.address}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={userProfile.city}
                      onChange={(e) =>
                        setUserProfile({ ...userProfile, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      value={userProfile.state}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={userProfile.postalCode}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          postalCode: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={userProfile.country}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          country: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate}>Save Changes</Button>
                </div>
              </TabsContent>

              <TabsContent value="password" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={password.current}
                      onChange={(e) =>
                        setPassword({ ...password, current: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={password.new}
                      onChange={(e) =>
                        setPassword({ ...password, new: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={password.confirm}
                      onChange={(e) =>
                        setPassword({ ...password, confirm: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="pt-2 text-sm text-muted-foreground">
                  Password must be at least 8 characters long and include
                  uppercase, lowercase, numbers, and special characters.
                </div>
                <div className="flex justify-end">
                  <Button onClick={handlePasswordChange}>
                    Change Password
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
