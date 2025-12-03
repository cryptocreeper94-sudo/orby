import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, X, Play, Pause, SkipForward,
  HelpCircle, MapPin, Sparkles, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOnboarding, onboardingPages } from '@/lib/OnboardingContext';
import { useMode } from '@/lib/ModeContext';

export function OnboardingOverlay() {
  const [, setLocation] = useLocation();
  const { isSandbox } = useMode();
  const {
    isOnboarding,
    currentPage,
    currentStep,
    currentPageIndex,
    currentStepIndex,
    totalPages,
    progress,
    nextStep,
    prevStep,
    pauseOnboarding,
    completeOnboarding,
    skipToPage
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isPeekMode, setIsPeekMode] = useState(false);

  useEffect(() => {
    if (!isOnboarding || !currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const findElement = () => {
      const element = document.querySelector(currentStep.targetSelector!) as HTMLElement;
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    findElement();
    const timer = setInterval(findElement, 500);
    
    const handleResize = () => findElement();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOnboarding, currentStep]);

  const handleNavigateToPage = useCallback((pageId: string) => {
    const page = onboardingPages.find(p => p.id === pageId);
    if (page) {
      const route = isSandbox && page.sandboxRoute ? page.sandboxRoute : page.route;
      setLocation(route);
    }
  }, [isSandbox, setLocation]);

  const handleNext = useCallback(() => {
    const nextPageIndex = currentStepIndex >= (currentPage?.steps.length || 0) - 1 
      ? currentPageIndex + 1 
      : currentPageIndex;
    
    if (nextPageIndex !== currentPageIndex && nextPageIndex < onboardingPages.length) {
      const nextPage = onboardingPages[nextPageIndex];
      handleNavigateToPage(nextPage.id);
    }
    nextStep();
  }, [currentStepIndex, currentPageIndex, currentPage, handleNavigateToPage, nextStep]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  if (!isOnboarding || !currentPage || !currentStep) return null;

  const isFirstStep = currentPageIndex === 0 && currentStepIndex === 0;
  const isLastStep = currentPageIndex === onboardingPages.length - 1 && 
    currentStepIndex === currentPage.steps.length - 1;

  const isCentered = !targetRect || currentStep.position === 'center';
  
  const getCardPosition = (): React.CSSProperties => {
    if (isCentered) {
      return {};
    }

    const padding = 20;
    const cardWidth = 360;
    const cardHeight = 280;
    
    let top = targetRect!.bottom + padding;
    let left = targetRect!.left + (targetRect!.width / 2) - (cardWidth / 2);

    if (currentStep.position === 'top') {
      top = targetRect!.top - cardHeight - padding;
    } else if (currentStep.position === 'left') {
      left = targetRect!.left - cardWidth - padding;
      top = targetRect!.top + (targetRect!.height / 2) - (cardHeight / 2);
    } else if (currentStep.position === 'right') {
      left = targetRect!.right + padding;
      top = targetRect!.top + (targetRect!.height / 2) - (cardHeight / 2);
    }

    if (left + cardWidth > window.innerWidth - padding) {
      left = window.innerWidth - cardWidth - padding;
    }
    if (left < padding) left = padding;

    if (top + cardHeight > window.innerHeight - padding) {
      top = targetRect!.top - cardHeight - padding;
    }
    if (top < padding) top = padding;

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 10001
    };
  };

  const cardElement = (
    <Card className="w-[360px] max-w-[90vw] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 shadow-2xl shadow-cyan-500/20" data-testid="onboarding-card">
      <CardContent className="p-0">
        <div className="relative p-4 border-b border-slate-700/50">
          <div className="absolute top-0 left-0 right-0 h-1">
            <Progress value={progress} className="h-1 rounded-none bg-slate-700" />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentPage.icon}</span>
              <div>
                <p className="text-xs text-cyan-400 font-medium">
                  {currentPageIndex + 1} of {totalPages} • Step {currentStepIndex + 1}/{currentPage.steps.length}
                </p>
                <h3 className="text-white font-semibold">{currentPage.title}</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPeekMode(!isPeekMode)}
                className={`h-8 w-8 transition-colors ${
                  isPeekMode 
                    ? 'text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                data-testid="peek-mode-toggle"
                title={isPeekMode ? 'Hide page' : 'View page'}
              >
                {isPeekMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={pauseOnboarding}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                data-testid="pause-onboarding"
              >
                <Pause className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                data-testid="skip-onboarding"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <motion.div
            key={`${currentPageIndex}-${currentStepIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              {currentStep.title}
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {currentStep.description}
            </p>
          </motion.div>

          {currentStep.liveRoute && (
            <Button
              variant="link"
              size="sm"
              className="mt-3 p-0 h-auto text-cyan-400 hover:text-cyan-300"
              onClick={() => {
                const route = isSandbox && currentStep.sandboxRoute 
                  ? currentStep.sandboxRoute 
                  : currentStep.liveRoute!;
                setLocation(route);
              }}
              data-testid="onboarding-link"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {currentStep.linkText || 'Go there now'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 p-4 pt-0">
          <div className="flex gap-1.5 flex-1">
            {onboardingPages.map((page, idx) => (
              <button
                key={page.id}
                onClick={() => {
                  skipToPage(idx);
                  handleNavigateToPage(page.id);
                }}
                className={`h-2 flex-1 rounded-full transition-all ${
                  idx === currentPageIndex 
                    ? 'bg-cyan-400' 
                    : idx < currentPageIndex 
                      ? 'bg-cyan-600' 
                      : 'bg-slate-600'
                }`}
                data-testid={`page-dot-${idx}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={isFirstStep}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30"
            data-testid="prev-step"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
            data-testid="next-step"
          >
            {isLastStep ? (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                Finish Tour
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          touchAction: 'none',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isPeekMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.5)',
            backdropFilter: isPeekMode ? 'none' : 'blur(2px)',
            transition: 'all 0.3s ease',
          }}
          onClick={pauseOnboarding}
        />

        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              zIndex: 9999,
              borderRadius: '12px',
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: isPeekMode
                ? '0 0 0 4px rgba(6, 182, 212, 0.8), 0 0 0 9999px rgba(0, 0, 0, 0.2)'
                : '0 0 0 4px rgba(6, 182, 212, 0.6), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
              background: 'transparent',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 0 0 rgba(6, 182, 212, 0.4)',
                  '0 0 0 12px rgba(6, 182, 212, 0)',
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '12px' }}
            />
          </motion.div>
        )}

        {isCentered ? (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 10001,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ pointerEvents: 'auto' }}
            >
              {cardElement}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={getCardPosition()}
          >
            {cardElement}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function OnboardingHelpButton() {
  const { isComplete, openSlideshow, resumeOnboarding, isOnboarding } = useOnboarding();

  if (isOnboarding) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
      className="fixed bottom-20 right-4 z-50"
    >
      <Button
        onClick={isComplete ? openSlideshow : resumeOnboarding}
        className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/30"
        data-testid="help-button"
      >
        {isComplete ? (
          <HelpCircle className="h-6 w-6 text-white" />
        ) : (
          <Play className="h-6 w-6 text-white ml-1" />
        )}
      </Button>
    </motion.div>
  );
}
