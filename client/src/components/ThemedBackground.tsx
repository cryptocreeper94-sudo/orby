import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemedBackground({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useTheme();
  
  const isLightTheme = currentTheme.colors.textPrimary.includes("text-slate-9") || 
                       currentTheme.colors.textPrimary.includes("text-pink-9") ||
                       currentTheme.colors.textPrimary.includes("text-blue-9") ||
                       currentTheme.colors.textPrimary.includes("text-green-9") ||
                       currentTheme.colors.textPrimary.includes("text-purple-9") ||
                       currentTheme.colors.textPrimary.includes("text-yellow-9") ||
                       currentTheme.colors.textPrimary.includes("text-orange-9") ||
                       currentTheme.colors.textPrimary.includes("text-teal-9") ||
                       currentTheme.colors.textPrimary.includes("text-violet-9");
  
  return (
    <div 
      className={cn(
        "fixed inset-0 overflow-hidden transition-all duration-500",
        "bg-gradient-to-br",
        currentTheme.colors.primary
      )}
      data-testid="themed-background"
      data-theme={currentTheme.id}
    >
      {!isLightTheme && (
        <div 
          className={cn(
            "absolute inset-0 opacity-30 pointer-events-none",
            "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
            currentTheme.colors.secondary
          )} 
        />
      )}
      {children}
    </div>
  );
}

export default ThemedBackground;
