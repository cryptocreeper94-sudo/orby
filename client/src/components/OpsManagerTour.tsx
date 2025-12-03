import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { opsManagerPages, isOpsManagerTourPending } from '@/lib/OnboardingContext';

const OPS_MANAGER_TOUR_KEY = 'orby_ops_manager_tour_complete';
const OPS_MANAGER_TOUR_PENDING_KEY = 'orby_ops_manager_tour_pending';

export function OpsManagerTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const totalPages = opsManagerPages.length;
  const currentPage = opsManagerPages[currentPageIndex];
  const currentStep = currentPage?.steps[currentStepIndex];
  const totalSteps = opsManagerPages.reduce((sum, p) => sum + p.steps.length, 0);
  const completedSteps = opsManagerPages
    .slice(0, currentPageIndex)
    .reduce((sum, p) => sum + p.steps.length, 0) + currentStepIndex;
  const progress = totalSteps > 0 ? ((completedSteps + 1) / totalSteps) * 100 : 0;

  useEffect(() => {
    if (isOpsManagerTourPending()) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isActive || !currentStep?.targetSelector) {
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
    window.addEventListener('resize', findElement);
    window.addEventListener('scroll', findElement, true);

    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', findElement);
      window.removeEventListener('scroll', findElement, true);
    };
  }, [isActive, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < currentPage.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentPageIndex < opsManagerPages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    } else {
      localStorage.setItem(OPS_MANAGER_TOUR_KEY, 'true');
      localStorage.removeItem(OPS_MANAGER_TOUR_PENDING_KEY);
      setIsActive(false);
    }
  }, [currentPageIndex, currentStepIndex, currentPage]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else if (currentPageIndex > 0) {
      const prevPage = opsManagerPages[currentPageIndex - 1];
      setCurrentPageIndex(prev => prev - 1);
      setCurrentStepIndex(prevPage.steps.length - 1);
    }
  }, [currentPageIndex, currentStepIndex]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(OPS_MANAGER_TOUR_KEY, 'true');
    localStorage.removeItem(OPS_MANAGER_TOUR_PENDING_KEY);
    setIsActive(false);
  }, []);

  if (!isActive) return null;

  const isFirst = currentPageIndex === 0 && currentStepIndex === 0;
  const isLast = currentPageIndex === opsManagerPages.length - 1 && 
                 currentStepIndex === currentPage.steps.length - 1;

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999]"
        style={{ touchAction: 'none' }}
      >
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        />

        {targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute pointer-events-none"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.8)',
              borderRadius: '12px',
              border: '2px solid rgba(6, 182, 212, 0.6)',
            }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 bottom-8 -translate-x-1/2 w-full max-w-md px-4"
        >
          <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/40 shadow-2xl shadow-cyan-500/20">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-700 rounded-t-lg overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                data-testid="button-skip-tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center border border-cyan-500/40">
                  <Crown className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cyan-400/70 font-medium uppercase tracking-wider">
                      {currentPage.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {completedSteps + 1}/{totalSteps}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{currentStep.title}</h3>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {currentStep.description}
              </p>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={isFirst}
                  className="text-slate-400 hover:text-white disabled:opacity-30"
                  data-testid="button-tour-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>

                <div className="flex items-center gap-1">
                  {opsManagerPages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx < currentPageIndex 
                          ? 'bg-cyan-400' 
                          : idx === currentPageIndex 
                            ? 'bg-cyan-400/50' 
                            : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white"
                  data-testid="button-tour-next"
                >
                  {isLast ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Let's Go!
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
