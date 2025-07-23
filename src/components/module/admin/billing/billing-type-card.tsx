"use client";

import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingTypeCardProps } from "@/types/admin/billing-types";

export function BillingTypeCard({
  option,
  isSelected,
  onSelect,
  disabled = false,
}: BillingTypeCardProps) {
  const IconComponent = option.icon;

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-200 hover:shadow-md",
        "border-2 hover:border-primary/20",
        isSelected && "border-primary bg-primary/5 shadow-md",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:scale-[1.02]"
      )}
      onClick={() => !disabled && onSelect(option.id)}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-1">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Recommended badge */}
      {option.recommended && (
        <div className="absolute -top-2 -left-2 z-10">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Recommended
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isSelected 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground"
          )}>
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-base leading-tight",
              isSelected && "text-primary"
            )}>
              {option.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {option.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Features
          </h4>
          <ul className="space-y-1">
            {option.features.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                  isSelected ? "bg-primary" : "bg-muted-foreground"
                )} />
                <span className="text-muted-foreground leading-relaxed">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}