// settings/page.tsx
"use client";
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const { theme } = useTheme();

  return (
    <div>
      Theme (SettingsPage): {theme}
    </div>
  );
}