// context/ThemeContext.tsx
"use client";

import React, { createContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {}, // Provide a default no-op function
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.body.classList.toggle('light', storedTheme === 'light');
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);


  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return React.useContext(ThemeContext);
};
