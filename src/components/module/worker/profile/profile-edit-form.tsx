import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/actions/worker/profile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileUpdateData } from "@/types/worker/profile";
import { UserProfileData } from "@/types/worker/profile";
import { 
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { z } from "zod";

// Schema for form validation
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

interface ProfileEditFormProps {
  userId: string;
  userData: UserProfileData;
  onUpdateSuccess: () => void;
}

export function ProfileEditForm({ userId, userData, onUpdateSuccess }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: userData.profile?.firstName || "",
      lastName: userData.profile?.lastName || "",
      phoneNumber: userData.profile?.phoneNumber || "",
      address: userData.profile?.address || "",
      city: userData.profile?.city || "",
      state: userData.profile?.state || "",
      country: userData.profile?.country || "",
      postalCode: userData.profile?.postalCode || "",
    },
  });

  const onSubmit = async (data: ProfileUpdateData) => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const result = await updateUserProfile(userId, data);
      
      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        
        // Call the callback to refresh parent component data
        onUpdateSuccess();
      } else {
        setErrorMsg("Failed to update profile information.");
        
        toast({
          title: "Error",
          description: "Failed to update profile information.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMsg("An unexpected error occurred.");
      
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            className={errors.firstName ? "border-red-500" : ""}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm">{errors.firstName.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            className={errors.lastName ? "border-red-500" : ""}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm">{errors.lastName.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            {...register("phoneNumber")}
          />
        </div>
        
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            {...register("address")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register("city")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            {...register("state")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register("country")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            {...register("postalCode")}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </div>
    </form>
  );
} 