import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InspectorWorkDetailsFormProps {
  data: {
    specialization?: string | null;
    department?: string | null;
    employeeId?: string | null;
    joinedDate?: string | null;
    workCenters?: Array<{
      name: string;
      isPrimary?: boolean;
    }> | null;
  };
}

export function InspectorWorkDetailsForm({ data }: InspectorWorkDetailsFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="specialization">Specialization</Label>
          <Input
            id="specialization"
            value={data.specialization ?? ""}
            disabled
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={data.department ?? ""}
            disabled
          />
        </div>
        <div>
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input
            id="employeeId"
            value={data.employeeId ?? ""}
            disabled
          />
        </div>
        <div>
          <Label htmlFor="joinedDate">Joined Date</Label>
          <Input
            id="joinedDate"
            value={data.joinedDate ?? ""}
            disabled
          />
        </div>
      </div>

      {data.workCenters && data.workCenters.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-medium mb-3">Assigned Work Centers</h3>
          <div className="bg-muted p-3 rounded-md">
            <ul className="space-y-2">
              {data.workCenters.map((workCenter, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{workCenter.name}</span>
                  {workCenter.isPrimary && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      Primary
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="pt-2 text-sm text-muted-foreground">
        <p>Work details cannot be modified directly. Please contact your supervisor for any changes.</p>
      </div>
    </div>
  );
}
