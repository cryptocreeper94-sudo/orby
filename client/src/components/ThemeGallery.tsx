import { useTheme } from "@/contexts/ThemeContext";
import { THEME_CATEGORIES, categoryOrder, Theme } from "@/data/themes";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Lock, Check, Crown, Palette, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  theme: Theme;
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
}

function ThemeCard({ theme, isActive, isLocked, onClick }: ThemeCardProps) {
  const gradientClasses = theme.colors.primary.replace(/from-|via-|to-/g, (match) => match);
  
  return (
    <motion.button
      data-testid={`theme-card-${theme.id}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "relative flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden",
        "border-2 transition-all duration-200",
        isActive 
          ? "border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/30" 
          : "border-white/10 hover:border-white/30",
        isLocked && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        theme.colors.primary
      )} />
      
      <div className={cn(
        "absolute inset-x-0 bottom-0 h-8 bg-gradient-to-br",
        theme.colors.secondary,
        "opacity-50"
      )} />
      
      {isActive && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      
      {isLocked && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-800/80 flex items-center justify-center">
          <Lock className="w-3 h-3 text-slate-400" />
        </div>
      )}
      
      <div className="absolute inset-x-0 bottom-0 p-1 bg-black/50 backdrop-blur-sm">
        <p className="text-[9px] text-white/90 font-medium truncate text-center leading-tight">
          {theme.name.split(' ').slice(0, 2).join(' ')}
        </p>
      </div>
    </motion.button>
  );
}

interface ThemeCategorySectionProps {
  categoryId: string;
  themes: Theme[];
}

function ThemeCategorySection({ categoryId, themes }: ThemeCategorySectionProps) {
  const { currentTheme, setTheme, canUseTheme } = useTheme();
  const categoryInfo = THEME_CATEGORIES.find(c => c.id === categoryId);
  
  if (!categoryInfo || themes.length === 0) return null;
  
  const freeCount = themes.filter(t => canUseTheme(t.id)).length;
  const lockedCount = themes.length - freeCount;
  
  return (
    <AccordionItem value={categoryId} className="border-white/10">
      <AccordionTrigger 
        data-testid={`theme-category-${categoryId}`}
        className="px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
            categoryInfo.color
          )}>
            <Palette className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-white">{categoryInfo.label}</span>
            <span className="text-xs text-slate-400">
              {themes.length} themes
              {lockedCount > 0 && ` (${lockedCount} locked)`}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div 
          className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentTheme.id === theme.id}
              isLocked={!canUseTheme(theme.id)}
              onClick={() => setTheme(theme.id)}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function ThemeGallery() {
  const { currentTheme, isSubscriber, setIsSubscriber, themesByCategory, availableThemes } = useTheme();
  
  const totalThemes = availableThemes.length;
  const unlockedThemes = availableThemes.filter(t => 
    isSubscriber || ["orby-aqua", "light-mode", "dark-mode", "pure-black", "ocean-blue"].includes(t.id)
  ).length;
  
  return (
    <div className="flex flex-col h-full bg-slate-950" data-testid="theme-gallery">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Theme Gallery</h2>
            <p className="text-xs text-slate-400">
              {unlockedThemes} of {totalThemes} themes unlocked
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className={cn(
            "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
            currentTheme.colors.primary
          )}>
            <Crown className="w-6 h-6 text-white/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">Current Theme</p>
            <p className="text-sm font-semibold text-white truncate">{currentTheme.name}</p>
          </div>
        </div>
        
        {!isSubscriber && (
          <button
            data-testid="toggle-subscriber-demo"
            onClick={() => setIsSubscriber(true)}
            className="w-full mt-3 py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Crown className="w-4 h-4" />
            Unlock All {totalThemes} Themes
          </button>
        )}
        
        {isSubscriber && (
          <button
            data-testid="toggle-demo-mode"
            onClick={() => setIsSubscriber(false)}
            className="w-full mt-3 py-2 px-4 rounded-xl bg-white/10 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
          >
            Switch to Demo Mode
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={["classic"]} className="w-full">
          {categoryOrder.map((categoryId) => {
            const themes = themesByCategory[categoryId] || [];
            return (
              <ThemeCategorySection 
                key={categoryId} 
                categoryId={categoryId} 
                themes={themes} 
              />
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

export default ThemeGallery;
