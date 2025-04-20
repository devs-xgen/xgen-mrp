'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getLoggedInInspectorData } from '@/lib/actions/inspectors';
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
  phone?: string | null;
  // Add other personal info fields
}

interface InspectorWorkDetails {
  position?: string | null;
  department?: string | null;
  employeeId?: string | null;
  joinedDate?: string | null;
  // Add other work details fields
}

interface InspectorAddress {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  // Add other address fields
}

interface PasswordForm {
  current: string;
  new: string;
  confirm: string;
}

interface InspectorWithRelations {
  inspectorId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  position?: string | null;
  department?: string | null;
  employeeId?: string | null;
  joinedDate?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  // Include other relevant fields
}

// Profile Information Card Component
export function ProfileInformationCard() {
  const { data: session, status } = useSession();
  const [inspectorData, setInspectorData] = useState<InspectorWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<InspectorProfile>({
    inspectorId: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: null,
  });
  const [workDetails, setWorkDetails] = useState<InspectorWorkDetails>({
    position: null,
    department: null,
    employeeId: null,
    joinedDate: null,
  });
  const [address, setAddress] = useState<InspectorAddress>({
    address: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
  });
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
      setLoading(true);
      setError(null);

      try {
        const data = await getLoggedInInspectorData();
        if (data) {
          setInspectorData(data);
          setUserProfile({
            inspectorId: data.inspectorId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || null,
          });
          setWorkDetails({
            position: data.position || null,
            department: data.department || null,
            employeeId: data.employeeId || null,
            joinedDate: data.joinedDate || null,
          });
          setAddress({
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            postalCode: data.postalCode || null,
            country: data.country || null,
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

  const handleProfileUpdate = () => {
    // Implement your logic to update personal info
    console.log('Personal Info Updated:', userProfile);
    toast({ title: 'Personal Info Updated', description: 'Your personal information has been updated.' });
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
  if (!inspectorData) return <div>Could not load profile information.</div>;

  return (
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
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={userProfile.phone || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
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
                <Input id="position" value={workDetails.position || ''} disabled />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={workDetails.department || ''} disabled />
              </div>
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" value={workDetails.employeeId || ''} disabled />
              </div>
              <div>
                <Label htmlFor="joinedDate">Joined Date</Label>
                <Input id="joinedDate" value={workDetails.joinedDate || ''} disabled />
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
                  value={address.address || ''}
                  onChange={(e) => setAddress({ ...address, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={address.city || ''} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="state">State / Province</Label>
                <Input id="state" value={address.state || ''} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" value={address.postalCode || ''} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={address.country || ''} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
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
              Password must be at least 8 characters long and include
              uppercase, lowercase, numbers, and special characters.
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

