import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InspectorProfileHeaderProps {
  userData: {
    firstName: string;
    lastName: string;
    specialization?: string | null;  // Use specialization for inspector's role/position
    department?: string | null;
    avatar?: string | null;
    email: string;
  };
}

export function InspectorProfileHeader({ userData }: InspectorProfileHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <Avatar className="h-20 w-20">
        {userData.avatar ? (
          <AvatarImage src={userData.avatar} alt={`${userData.firstName} ${userData.lastName}`} />
        ) : (
          <AvatarFallback>
            {(userData.firstName?.charAt(0) ?? "")}
            {(userData.lastName?.charAt(0) ?? "")}
          </AvatarFallback>
        )}
      </Avatar>
      <div>
        <h3 className="text-2xl font-bold">
          {userData.firstName} {userData.lastName}
        </h3>
        <p className="text-muted-foreground">
          {userData.specialization && userData.department
            ? `${userData.specialization} • ${userData.department}`
            : userData.email}
        </p>
      </div>
    </div>
  );
}
