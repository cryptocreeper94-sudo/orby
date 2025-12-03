import { HelpCircle, Play, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/lib/OnboardingContext';
import { cn } from '@/lib/utils';

interface HeaderTutorialButtonProps {
  className?: string;
  variant?: 'icon' | 'full';
}

export function HeaderTutorialButton({ className, variant = 'full' }: HeaderTutorialButtonProps) {
  const { isComplete, openSlideshow, resumeOnboarding, isOnboarding } = useOnboarding();

  if (isOnboarding) return null;

  if (variant === 'icon') {
    return (
      <Button
        onClick={isComplete ? openSlideshow : resumeOnboarding}
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30",
          className
        )}
        data-testid="header-tutorial-button"
      >
        {isComplete ? (
          <BookOpen className="h-4 w-4 text-cyan-400" />
        ) : (
          <Play className="h-4 w-4 text-cyan-400" />
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={isComplete ? openSlideshow : resumeOnboarding}
      variant="ghost"
      className={cn(
        "h-9 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 gap-2",
        className
      )}
      data-testid="header-tutorial-button"
    >
      {isComplete ? (
        <>
          <BookOpen className="h-4 w-4" />
          <span className="text-sm font-medium">Tutorial</span>
        </>
      ) : (
        <>
          <Play className="h-4 w-4" />
          <span className="text-sm font-medium">Continue Tour</span>
        </>
      )}
    </Button>
  );
}
