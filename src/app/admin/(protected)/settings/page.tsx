// settings/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";
import ToggleableCard from "@/components/togglebutton";
import { useTheme } from '@/context/ThemeContext';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import '@/styles/globals.css'; // Make sure this path is correct

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();

    const handleThemeChange = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="container mx-auto py-10">
            <Card className={cn(
                "container mx-auto py-10", // Always applied
            theme === 'dark' && "dark:bg-gray-900 dark:text-white", // Dark theme for outer div
            theme === 'light' && "light:bg-gray-100 light:text-gray-800"  // Light theme
            )}>
                <CardHeader className="text-center">
                    <Construction className="w-12 h-12 mx-auto" />
                    <CardTitle className="text-2xl mt-4">Settings Page</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p>We're working hard to bring you amazing new features.</p>
                    <p className="mt-2">Stay tuned for updates!</p>
                    <Button onClick={handleThemeChange} className={cn(
                        "border-2 mb-8",// Base styles
                        theme === 'dark' && "dark:bg-black-700 dark:hover:bg-gray-600 dark:text-white",
                        theme === 'light' && "light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-800"
                    )}>
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </Button>
                </CardContent>
            </Card>

            <ToggleableCard />
        </div>
    );
}