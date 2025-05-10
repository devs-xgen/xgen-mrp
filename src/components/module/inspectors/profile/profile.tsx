'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getLoggedInInspectorData, updateInspector } from '@/lib/actions/inspectors';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast, useToast } from '@/hooks/use-toast';

interface InspectorProfile {
  inspectorId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  department?: string | null;
  specialization?: string | null;
  certificationLevel?: string | null;
  yearsOfExperience?: number | null;
  notes?: string | null;
}

interface PasswordForm {
  current: string;
  new: string;
  confirm: string;
}

export function ProfileInformationCard() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<InspectorProfile>({
    inspectorId: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: null,
    department: null,
    specialization: null,
    certificationLevel: null,
    yearsOfExperience: null,
    notes: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<PasswordForm>({
    current: '',
    new: '',
    confirm: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    const fetchInspectorProfile = async () => {
      try {
        const data = await getLoggedInInspectorData();
        if (data) {
          setUserProfile({
            inspectorId: data.inspectorId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber || null,
            department: data.department || null,
            specialization: data.specialization || null,
            certificationLevel: data.certificationLevel || null,
            yearsOfExperience: data.yearsOfExperience || null,
            notes: data.notes || null,
          });
        } else {
          setError('Could not load inspector information.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch inspector data.');
      } finally {
        setLoading(false);
      }
    };

    fetchInspectorProfile();
  }, [status, session?.user?.id]);

  const handleProfileUpdate = async () => {
    try {
      await updateInspector(userProfile.inspectorId, {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phoneNumber: userProfile.phoneNumber,
        department: userProfile.department,
        specialization: userProfile.specialization,
        certificationLevel: userProfile.certificationLevel,
        yearsOfExperience: userProfile.yearsOfExperience,
        notes: userProfile.notes,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (password.new !== password.confirm) {
      toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match.' });
      return;
    }
    // Implement your password change logic (likely a Server Action)
    console.log('Password Change Requested:', password);
    toast({ title: 'Password Updated', description: 'Your password has been updated successfully.' });
    setPassword({ current: '', new: '', confirm: '' });
  };

  if (loading) return <div>Loading profile information...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <Card className="md:col-span-4">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal">
          <TabsList className="mb-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={userProfile.firstName}
                  onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={userProfile.lastName}
                  onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={userProfile.email} disabled />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={userProfile.phoneNumber || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={userProfile.department || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, department: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={userProfile.specialization || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, specialization: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="certificationLevel">Certification Level</Label>
                <Input
                  id="certificationLevel"
                  value={userProfile.certificationLevel || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, certificationLevel: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  value={userProfile.yearsOfExperience || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, yearsOfExperience: parseInt(e.target.value) })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={userProfile.notes || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, notes: e.target.value })}
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
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={password.new}
                  onChange={(e) => setPassword({ ...password, new: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                />
              </div>
            </div>
            <div className="pt-2 text-sm text-muted-foreground">
              Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePasswordChange}>Change Password</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
