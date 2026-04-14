import React, { createContext, useContext, useState, useEffect } from 'react';

interface PreferencesContextType {
  language: string;
  setLanguage: (lang: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('pref_lang') || 'English');
  const [theme, setThemeState] = useState(() => localStorage.getItem('pref_theme') || 'System');

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('pref_lang', lang);
  };

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem('pref_theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'System') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme.toLowerCase());
    }
  }, [theme]);

  return (
    <PreferencesContext.Provider value={{ language, setLanguage, theme, setTheme }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
