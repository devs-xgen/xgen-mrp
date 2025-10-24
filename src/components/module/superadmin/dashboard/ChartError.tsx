import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ChartErrorProps {
  title: string;
  description?: string;
  error?: string;
}

export function ChartError({ title, description, error }: ChartErrorProps) {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">Unable to load chart data</p>
          {error && (
            <p className="text-xs mt-2 text-destructive/70">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
