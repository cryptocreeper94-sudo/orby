import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { X, ChevronLeft, ChevronRight, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTutorialForPage, TutorialStep, PageTutorial } from '@/lib/tutorialConfig';

interface TutorialCoachProps {
  page: string;
  onNavigate?: (route: string) => void;
}

const TUTORIAL_COMPLETION_KEY = 'stadiumops_tutorials_completed';

function getTutorialCompletionState(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(TUTORIAL_COMPLETION_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setTutorialCompleted(page: string) {
  const state = getTutorialCompletionState();
  state[page] = true;
  localStorage.setItem(TUTORIAL_COMPLETION_KEY, JSON.stringify(state));
}

function isTutorialCompleted(page: string): boolean {
  return getTutorialCompletionState()[page] === true;
}

export function TutorialCoach({ page, onNavigate }: TutorialCoachProps) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorial, setTutorial] = useState<PageTutorial | undefined>();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const config = getTutorialForPage(page);
    setTutorial(config);
    setCurrentStep(0);
    
    if (config && !isTutorialCompleted(page)) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [page]);

  useEffect(() => {
    if (!isOpen || !tutorial) return;
    
    const step = tutorial.steps[currentStep];
    if (step?.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        setTargetRect(element.getBoundingClientRect());
        
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetElement(null);
        setTargetRect(null);
      }
    } else {
      setTargetElement(null);
      setTargetRect(null);
    }
  }, [isOpen, currentStep, tutorial]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => {
      if (targetElement) {
        setTargetRect(targetElement.getBoundingClientRect());
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen, targetElement]);

  const handleNext = useCallback(() => {
    if (!tutorial) return;
    
    if (currentStep < tutorial.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [tutorial, currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTutorialCompleted(page);
    setTargetElement(null);
    setTargetRect(null);
  }, [page]);

  const handleLinkClick = useCallback((route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      setLocation(route);
    }
    handleClose();
  }, [onNavigate, setLocation, handleClose]);

  const openTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  if (!tutorial) return null;

  const step = tutorial.steps[currentStep];
  const isLastStep = currentStep === tutorial.steps.length - 1;
  const isFirstStep = currentStep === 0;

  const getCardPosition = (): React.CSSProperties => {
    if (!targetRect || step?.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001
      };
    }

    const padding = 16;
    const cardWidth = 320;
    const cardHeight = 200;
    
    let top = targetRect.bottom + padding;
    let left = targetRect.left;

    if (step?.position === 'top') {
      top = targetRect.top - cardHeight - padding;
    } else if (step?.position === 'left') {
      left = targetRect.left - cardWidth - padding;
      top = targetRect.top;
    } else if (step?.position === 'right') {
      left = targetRect.right + padding;
      top = targetRect.top;
    }

    if (left + cardWidth > window.innerWidth - padding) {
      left = window.innerWidth - cardWidth - padding;
    }
    if (left < padding) left = padding;

    if (top + cardHeight > window.innerHeight - padding) {
      top = targetRect.top - cardHeight - padding;
    }
    if (top < padding) top = padding;

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 10001
    };
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={openTutorial}
        className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600"
        data-testid="button-help"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[9999]"
            onClick={handleClose}
          />

          {targetRect && (
            <div
              className="fixed z-[10000] rounded-lg ring-4 ring-blue-400 ring-offset-2 ring-offset-transparent"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                backgroundColor: 'transparent',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
              }}
            />
          )}

          <Card 
            className="w-80 max-w-[90vw] shadow-2xl"
            style={getCardPosition()}
            data-testid="tutorial-card"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    Step {currentStep + 1} of {tutorial.steps.length}
                  </Badge>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 -mr-2 -mt-2"
                  data-testid="button-close-tutorial"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{step.body}</p>
              
              {step.linkRoute && step.linkText && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={() => handleLinkClick(step.linkRoute!)}
                  data-testid={`link-${step.id}`}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {step.linkText}
                </Button>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={isFirstStep}
                  data-testid="button-prev-step"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                
                <div className="flex gap-1">
                  {tutorial.steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        idx === currentStep ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  size="sm"
                  onClick={handleNext}
                  data-testid="button-next-step"
                >
                  {isLastStep ? 'Done' : 'Next'}
                  {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

export function TutorialHelpButton({ page }: { page: string }) {
  const tutorial = getTutorialForPage(page);
  if (!tutorial) return null;
  
  return <TutorialCoach page={page} />;
}
