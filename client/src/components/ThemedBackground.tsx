import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const themeColorMap: Record<string, string> = {
  'from-slate-950': '#020617',
  'from-slate-900': '#0f172a',
  'from-blue-950': '#172554',
  'from-blue-900': '#1e3a8a',
  'from-cyan-950': '#083344',
  'from-cyan-900': '#164e63',
  'from-emerald-950': '#022c22',
  'from-emerald-900': '#064e3b',
  'from-purple-950': '#3b0764',
  'from-purple-900': '#581c87',
  'from-pink-950': '#500724',
  'from-pink-900': '#831843',
  'from-amber-950': '#451a03',
  'from-amber-900': '#78350f',
  'from-orange-950': '#431407',
  'from-orange-900': '#7c2d12',
  'from-red-950': '#450a0a',
  'from-red-900': '#7f1d1d',
  'from-green-950': '#052e16',
  'from-green-900': '#14532d',
  'from-teal-950': '#042f2e',
  'from-teal-900': '#134e4a',
  'from-indigo-950': '#1e1b4b',
  'from-indigo-900': '#312e81',
  'from-violet-950': '#2e1065',
  'from-violet-900': '#4c1d95',
  'from-fuchsia-950': '#4a044e',
  'from-fuchsia-900': '#701a75',
  'from-rose-950': '#4c0519',
  'from-rose-900': '#881337',
  'from-sky-950': '#082f49',
  'from-sky-900': '#0c4a6e',
  'from-lime-950': '#1a2e05',
  'from-lime-900': '#365314',
  'from-yellow-950': '#422006',
  'from-yellow-900': '#713f12',
  'from-zinc-950': '#09090b',
  'from-zinc-900': '#18181b',
  'from-gray-950': '#030712',
  'from-gray-900': '#111827',
  'from-neutral-950': '#0a0a0a',
  'from-neutral-900': '#171717',
  'from-stone-950': '#0c0a09',
  'from-stone-900': '#1c1917',
  'from-white': '#ffffff',
  'from-slate-50': '#f8fafc',
  'from-blue-50': '#eff6ff',
  'from-pink-50': '#fdf2f8',
  'from-green-50': '#f0fdf4',
  'from-yellow-50': '#fefce8',
  'from-purple-50': '#faf5ff',
  'from-gray-100': '#f3f4f6',
  'from-amber-50': '#fffbeb',
  'from-rose-50': '#fff1f2',
};

function extractHexColor(tailwindClass: string): string {
  const classes = tailwindClass.split(' ');
  for (const cls of classes) {
    if (themeColorMap[cls]) {
      return themeColorMap[cls];
    }
  }
  return '#020617';
}

export function ThemedBackground({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useTheme();
  
  const primaryColor = extractHexColor(currentTheme.colors.primary);
  
  useEffect(() => {
    document.body.style.backgroundColor = primaryColor;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [primaryColor]);
  
  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 -z-10 transition-all duration-500 pointer-events-none",
          "bg-gradient-to-br",
          currentTheme.colors.primary
        )}
        data-testid="themed-background"
        data-theme={currentTheme.id}
        aria-hidden="true"
      />
      {children}
    </>
  );
}

export default ThemedBackground;
