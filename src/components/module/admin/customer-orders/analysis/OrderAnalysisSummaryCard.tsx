import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface OrderAnalysisSummaryCardProps {
  title: string;
  content: ReactNode;
  icon: LucideIcon;
  variant?: "default" | "green" | "orange" | "red" | "blue";
}

export function OrderAnalysisSummaryCard({ 
  title, 
  content, 
  icon: Icon, 
  variant = "default" 
}: OrderAnalysisSummaryCardProps) {
  const variants = {
    default: "text-primary",
    green: "text-green-600",
    orange: "text-orange-600", 
    red: "text-red-600",
    blue: "text-blue-600",
  };

  const iconColor = variants[variant];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="text-2xl font-bold">{content}</div>
      </CardContent>
    </Card>
  );
}
