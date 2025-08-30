// src/components/shared/page-layout.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function PageContainer({ className, ...props }: DivProps) {
  return (
    <div
      className={cn("flex-1 space-y-6 p-4 md:p-8 pt-6", className)}
      {...props}
    />
  );
}

export function PageHeader({ className, ...props }: DivProps) {
  return (
    <div
      className={cn("flex items-center justify-between space-y-2", className)}
      {...props}
    />
  );
}

export function PageHeaderMain({ className, ...props }: DivProps) {
  return <div className={cn(className)} {...props} />;
}

export function PageTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-3xl font-bold tracking-tight", className)} {...props} />
  );
}

export function PageDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-muted-foreground mt-1", className)} {...props} />
  );
}

export function PageHeaderActions({ className, ...props }: DivProps) {
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}

interface SectionCardProps extends DivProps {
  heading?: React.ReactNode;
  headerClassName?: string;
  contentClassName?: string;
}

export function SectionCard({
  heading,
  className,
  headerClassName,
  contentClassName,
  children,
  ...props
}: SectionCardProps) {
  return (
    <Card className={cn("bg-card border rounded-lg", className)} {...props}>
      {(heading !== undefined && heading !== null) && (
        <CardHeader className={cn("pb-6", headerClassName)}>
          {typeof heading === "string" ? (
            <CardTitle className="text-lg">{heading}</CardTitle>
          ) : (
            heading
          )}
        </CardHeader>
      )}
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
