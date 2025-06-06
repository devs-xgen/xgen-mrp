// test/page.tsx
"use client";
import { useTheme } from '@/context/ThemeContext';
import { AnalyticsCardDemo } from '@/components/ui/analytics-card-demo';

export default function TestPage() {
  const { theme } = useTheme();

  return (
    <div className="container mx-auto">
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">Current Theme: {theme}</p>
      </div>
      <AnalyticsCardDemo />
    </div>
  );
}