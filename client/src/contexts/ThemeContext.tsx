import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { allThemes, FREE_THEME_IDS, Theme, ThemeCategory, ThemeColors } from "@/data/themes";

export type { Theme, ThemeCategory, ThemeColors };

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  isSubscriber: boolean;
  setIsSubscriber: (value: boolean) => void;
  canUseTheme: (themeId: string) => boolean;
  themesByCategory: Record<string, Theme[]>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "orby_theme";
const SUBSCRIBER_KEY = "orby_subscriber";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return allThemes[0];
    const savedThemeId = localStorage.getItem(STORAGE_KEY);
    return allThemes.find(t => t.id === savedThemeId) || allThemes[0];
  });

  const [isSubscriber, setIsSubscriberState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SUBSCRIBER_KEY) === 'true';
  });

  const canUseTheme = (themeId: string): boolean => {
    if (isSubscriber) return true;
    return FREE_THEME_IDS.includes(themeId);
  };

  const setTheme = (themeId: string) => {
    const theme = allThemes.find(t => t.id === themeId);
    if (theme && canUseTheme(themeId)) {
      setCurrentTheme(theme);
      localStorage.setItem(STORAGE_KEY, themeId);
    }
  };

  const setIsSubscriber = (value: boolean) => {
    setIsSubscriberState(value);
    localStorage.setItem(SUBSCRIBER_KEY, value.toString());
  };

  const themesByCategory = allThemes.reduce((acc: Record<string, Theme[]>, theme: Theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, Theme[]>);

  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-card-bg', colors.cardBg);
    root.style.setProperty('--theme-text-primary', colors.textPrimary);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-glow', colors.glow);
    root.style.setProperty('--theme-accent', colors.accent);
    
    root.setAttribute('data-theme', currentTheme.id);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      setTheme, 
      availableThemes: allThemes,
      isSubscriber,
      setIsSubscriber,
      canUseTheme,
      themesByCategory
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
