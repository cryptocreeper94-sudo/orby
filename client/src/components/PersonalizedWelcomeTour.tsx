import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Sparkles, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/lib/mockData';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface RoleTourConfig {
  role: string;
  greeting: string;
  themeColors: {
    primary: string;
    secondary: string;
    glow: string;
    border: string;
    gradient: string;
  };
  steps: TourStep[];
}

const TOUR_COMPLETE_PREFIX = 'orby_welcome_tour_complete_';
const TOUR_PENDING_PREFIX = 'orby_welcome_tour_pending_';

const roleTourConfigs: Record<string, RoleTourConfig> = {
  OperationsManager: {
    role: 'Operations Manager',
    greeting: 'Welcome to your Command Center',
    themeColors: {
      primary: 'from-cyan-500 to-blue-600',
      secondary: 'bg-cyan-500/20',
      glow: 'shadow-cyan-500/50',
      border: 'border-cyan-500/50',
      gradient: 'from-cyan-600 via-blue-500 to-cyan-600'
    },
    steps: [
      {
        id: 'ops-welcome',
        title: 'Your Operations Hub',
        description: 'This dashboard gives you complete visibility into every stand, every team member, and every active situation across the venue.',
        position: 'center'
      },
      {
        id: 'ops-mode-bar',
        title: 'Live vs Sandbox Mode',
        description: 'The top bar shows your current mode. Use Sandbox for training new staff - it uses demo data so nothing affects real operations.',
        targetSelector: '[data-testid^="global-mode-bar"]',
        position: 'bottom'
      },
      {
        id: 'ops-staffing-grid',
        title: 'Staffing Grid',
        description: 'See all stands at a glance - who\'s assigned, what\'s their status, and any issues that need attention.',
        targetSelector: '[data-testid="tab-grid"]',
        position: 'bottom'
      },
      {
        id: 'ops-map',
        title: 'Stadium Map',
        description: 'Interactive map shows stand locations, active alerts, and real-time staff positions.',
        targetSelector: '[data-testid="tab-map"]',
        position: 'bottom'
      },
      {
        id: 'ops-messages',
        title: 'Team Messages',
        description: 'Quick access to send messages to your entire team or specific stands. Everyone gets notified instantly.',
        targetSelector: '[data-testid="button-messages"]',
        position: 'bottom'
      },
      {
        id: 'ops-weather',
        title: 'Interactive Weather Map',
        description: 'Weather dictates stadium operations. Tap the weather icon for current conditions, or "View Interactive Weather Map" for full-screen radar.',
        targetSelector: '[data-testid="button-weather-toggle"]',
        position: 'bottom'
      }
    ]
  },
  Admin: {
    role: 'Administrator',
    greeting: 'Welcome to Admin Control',
    themeColors: {
      primary: 'from-purple-500 to-pink-600',
      secondary: 'bg-purple-500/20',
      glow: 'shadow-purple-500/50',
      border: 'border-purple-500/50',
      gradient: 'from-purple-600 via-pink-500 to-purple-600'
    },
    steps: [
      {
        id: 'admin-welcome',
        title: 'Your Admin Dashboard',
        description: 'Full control over staffing, check-ins, and HR operations. Everything you need to manage your team.',
        position: 'center'
      },
      {
        id: 'admin-mode-bar',
        title: 'Live vs Sandbox Mode',
        description: 'Switch to Sandbox mode for training. It uses demo data so new staff can practice without affecting real operations.',
        targetSelector: '[data-testid^="global-mode-bar"]',
        position: 'bottom'
      },
      {
        id: 'admin-tabs',
        title: 'Dashboard Tabs',
        description: 'Staffing Grid shows all positions, List View for quick status checks, Reports for documentation.',
        targetSelector: '[data-testid="tab-grid"]',
        position: 'bottom'
      },
      {
        id: 'admin-messages',
        title: 'Team Communication',
        description: 'Send announcements, check-in reminders, or direct messages to any staff member.',
        targetSelector: '[data-testid="button-messages"]',
        position: 'bottom'
      }
    ]
  },
  Supervisor: {
    role: 'Supervisor',
    greeting: 'Welcome to Your Station',
    themeColors: {
      primary: 'from-emerald-500 to-teal-600',
      secondary: 'bg-emerald-500/20',
      glow: 'shadow-emerald-500/50',
      border: 'border-emerald-500/50',
      gradient: 'from-emerald-600 via-teal-500 to-emerald-600'
    },
    steps: [
      {
        id: 'sup-welcome',
        title: 'Your Supervisor Hub',
        description: 'Manage your stand, coordinate with your team, and handle deliveries - all from one place.',
        position: 'center'
      },
      {
        id: 'sup-mode-bar',
        title: 'Live vs Sandbox Mode',
        description: 'Sandbox mode is for practice. Anything you do there won\'t affect real operations - great for learning!',
        targetSelector: '[data-testid^="global-mode-bar"]',
        position: 'bottom'
      },
      {
        id: 'sup-quick-actions',
        title: 'Quick Actions',
        description: 'One-tap buttons for the things you do most: request deliveries, report issues, check inventory.',
        targetSelector: '[data-testid="button-quick-actions"]',
        position: 'bottom'
      },
      {
        id: 'sup-deliveries',
        title: 'Delivery Tracking',
        description: 'See incoming deliveries in real-time. You\'ll know exactly when items are on their way.',
        targetSelector: '[data-testid="card-deliveries"]',
        position: 'bottom'
      },
      {
        id: 'sup-messages',
        title: 'Team Chat',
        description: 'Message your team leads, other supervisors, or request help from managers instantly.',
        targetSelector: '[data-testid="button-messages"]',
        position: 'bottom'
      }
    ]
  },
  TeamLead: {
    role: 'Team Lead',
    greeting: 'Ready to Lead',
    themeColors: {
      primary: 'from-amber-500 to-orange-600',
      secondary: 'bg-amber-500/20',
      glow: 'shadow-amber-500/50',
      border: 'border-amber-500/50',
      gradient: 'from-amber-600 via-orange-500 to-amber-600'
    },
    steps: [
      {
        id: 'lead-welcome',
        title: 'Your Team Lead Dashboard',
        description: 'Quick access to everything you need - from inventory counts to team communication.',
        position: 'center'
      },
      {
        id: 'lead-mode-bar',
        title: 'Live vs Sandbox',
        description: 'You\'re in Live mode for real work. Sandbox is available for practice anytime.',
        targetSelector: '[data-testid^="global-mode-bar"]',
        position: 'bottom'
      },
      {
        id: 'lead-tasks',
        title: 'Your Tasks',
        description: 'See what\'s assigned to you - inventory counts, setup checklists, or special requests.',
        targetSelector: '[data-testid="section-tasks"]',
        position: 'bottom'
      },
      {
        id: 'lead-counts',
        title: 'Inventory Counts',
        description: 'Quick counting tools - scan items or enter counts manually. Everything syncs automatically.',
        targetSelector: '[data-testid="button-count"]',
        position: 'bottom'
      }
    ]
  },
  Staff: {
    role: 'Team Member',
    greeting: 'Welcome to the Team',
    themeColors: {
      primary: 'from-blue-500 to-indigo-600',
      secondary: 'bg-blue-500/20',
      glow: 'shadow-blue-500/50',
      border: 'border-blue-500/50',
      gradient: 'from-blue-600 via-indigo-500 to-blue-600'
    },
    steps: [
      {
        id: 'staff-welcome',
        title: 'Your Orby Dashboard',
        description: 'Everything you need to do your job - instructions, communication, and help when you need it.',
        position: 'center'
      },
      {
        id: 'staff-instructions',
        title: 'Your Instructions',
        description: 'Find step-by-step guides for common tasks. Always know exactly what to do.',
        targetSelector: '[data-testid="section-instructions"]',
        position: 'bottom'
      },
      {
        id: 'staff-help',
        title: 'Need Help?',
        description: 'One tap to reach your supervisor or team lead. They\'ll get an instant notification.',
        targetSelector: '[data-testid="button-help"]',
        position: 'bottom'
      },
      {
        id: 'staff-messages',
        title: 'Messages',
        description: 'See announcements from management and chat with your team.',
        targetSelector: '[data-testid="button-messages"]',
        position: 'bottom'
      }
    ]
  },
  CulinaryDirector: {
    role: 'Culinary Director',
    greeting: 'Welcome to Your Kitchen Command',
    themeColors: {
      primary: 'from-orange-500 to-red-600',
      secondary: 'bg-orange-500/20',
      glow: 'shadow-orange-500/50',
      border: 'border-orange-500/50',
      gradient: 'from-orange-600 via-red-500 to-orange-600'
    },
    steps: [
      {
        id: 'culinary-welcome',
        title: 'Your Culinary Dashboard',
        description: 'Manage all kitchen operations from one place - cook scheduling, stand assignments, and check-ins.',
        position: 'center'
      },
      {
        id: 'culinary-mode-bar',
        title: 'Live vs Sandbox Mode',
        description: 'Sandbox mode lets you practice scheduling without affecting real assignments. Toggle to Live for event days.',
        targetSelector: '[data-testid^="global-mode-bar"]',
        position: 'bottom'
      },
      {
        id: 'culinary-scheduling',
        title: 'Cook Scheduling',
        description: 'Assign cooks to stands by event date. See who\'s available, who\'s assigned, and manage the full culinary team.',
        position: 'center'
      },
      {
        id: 'culinary-checkins',
        title: 'Check-In Tracking',
        description: 'Monitor cook arrivals in real-time. Mark no-shows and see who\'s ready across all stands.',
        position: 'center'
      }
    ]
  },
  CulinaryCook: {
    role: 'Culinary Cook',
    greeting: 'Ready for Service',
    themeColors: {
      primary: 'from-yellow-500 to-orange-600',
      secondary: 'bg-yellow-500/20',
      glow: 'shadow-yellow-500/50',
      border: 'border-yellow-500/50',
      gradient: 'from-yellow-600 via-orange-500 to-yellow-600'
    },
    steps: [
      {
        id: 'cook-welcome',
        title: 'Your Shift Dashboard',
        description: 'See your assigned stand, check-in when you arrive, and stay connected with Chef Deb and the culinary team.',
        position: 'center'
      },
      {
        id: 'cook-assignment',
        title: 'Your Assignment',
        description: 'Your current stand assignment is shown here. Tap to see location details and directions.',
        position: 'center'
      },
      {
        id: 'cook-checkin',
        title: 'Check In',
        description: 'When you arrive at your stand, tap Check In. Chef Deb will see you\'re ready in real-time.',
        targetSelector: '[data-testid="button-check-in"]',
        position: 'bottom'
      }
    ]
  },
  BarManager: {
    role: 'Bar Manager',
    greeting: 'Welcome to Bar Command',
    themeColors: {
      primary: 'from-purple-500 to-violet-600',
      secondary: 'bg-purple-500/20',
      glow: 'shadow-purple-500/50',
      border: 'border-purple-500/50',
      gradient: 'from-purple-600 via-violet-500 to-purple-600'
    },
    steps: [
      {
        id: 'bar-welcome',
        title: 'Your Bar Inventory Hub',
        description: 'Manage all bar inventory - liquor, mixers, beer, wine, and chargeables. Track stock levels across all locations.',
        position: 'center'
      },
      {
        id: 'bar-mode-bar',
        title: 'Live vs Sandbox Mode',
        description: 'Use Sandbox to practice inventory updates. Switch to Live for actual stock management.',
        targetSelector: '[data-testid^="global-mode-bar"]',
        position: 'bottom'
      },
      {
        id: 'bar-inventory',
        title: 'Stock Tracking',
        description: 'Monitor on-hand quantities, par levels, and variances. Know what needs restocking before you run out.',
        position: 'center'
      },
      {
        id: 'bar-integration',
        title: 'Yellow Dog & PAX Ready',
        description: 'When connected, Yellow Dog inventory syncs automatically. PAX Pay sales deduct from stock in real-time.',
        position: 'center'
      }
    ]
  }
};

export function isPersonalizedTourPending(userId: string): boolean {
  return localStorage.getItem(`${TOUR_PENDING_PREFIX}${userId}`) === 'true';
}

export function schedulePersonalizedTour(userId: string): void {
  const completeKey = `${TOUR_COMPLETE_PREFIX}${userId}`;
  if (localStorage.getItem(completeKey) !== 'true') {
    localStorage.setItem(`${TOUR_PENDING_PREFIX}${userId}`, 'true');
  }
}

export function hasCompletedTour(userId: string): boolean {
  return localStorage.getItem(`${TOUR_COMPLETE_PREFIX}${userId}`) === 'true';
}

export function PersonalizedWelcomeTour() {
  const { currentUser } = useStore();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const userRole = currentUser?.role || 'Staff';
  const userName = currentUser?.name?.split(' ')[0] || 'there';
  const userId = currentUser?.id || '';
  
  const config = roleTourConfigs[userRole] || roleTourConfigs['Staff'];
  const steps = config.steps;
  const currentStep = steps[currentStepIndex];
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  useEffect(() => {
    if (userId && isPersonalizedTourPending(userId)) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userId]);

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
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      localStorage.setItem(`${TOUR_COMPLETE_PREFIX}${userId}`, 'true');
      localStorage.removeItem(`${TOUR_PENDING_PREFIX}${userId}`);
      setIsActive(false);
    }
  }, [currentStepIndex, steps.length, userId]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(`${TOUR_COMPLETE_PREFIX}${userId}`, 'true');
    localStorage.removeItem(`${TOUR_PENDING_PREFIX}${userId}`);
    setIsActive(false);
  }, [userId]);

  if (!isActive || !currentUser) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const isCentered = !targetRect || currentStep?.position === 'center';

  const getCardPosition = () => {
    if (isCentered) {
      const cardWidth = 340;
      const cardHeight = 280;
      return { 
        top: `${Math.max(20, (window.innerHeight - cardHeight) / 2)}px`, 
        left: `${Math.max(20, (window.innerWidth - cardWidth) / 2)}px`
      };
    }

    const padding = 20;
    const cardWidth = 340;
    const cardHeight = 220;

    switch (currentStep?.position) {
      case 'bottom':
        return {
          top: `${Math.min(targetRect!.bottom + padding, window.innerHeight - cardHeight - padding)}px`,
          left: `${Math.max(padding, Math.min(targetRect!.left + targetRect!.width / 2 - cardWidth / 2, window.innerWidth - cardWidth - padding))}px`
        };
      case 'top':
        return {
          top: `${Math.max(padding, targetRect!.top - cardHeight - padding)}px`,
          left: `${Math.max(padding, Math.min(targetRect!.left + targetRect!.width / 2 - cardWidth / 2, window.innerWidth - cardWidth - padding))}px`
        };
      case 'left':
        return {
          top: `${Math.max(padding, targetRect!.top + targetRect!.height / 2 - cardHeight / 2)}px`,
          left: `${Math.max(padding, targetRect!.left - cardWidth - padding)}px`
        };
      case 'right':
        return {
          top: `${Math.max(padding, targetRect!.top + targetRect!.height / 2 - cardHeight / 2)}px`,
          left: `${Math.min(targetRect!.right + padding, window.innerWidth - cardWidth - padding)}px`
        };
      default:
        const defaultCardWidth = 340;
        const defaultCardHeight = 280;
        return { 
          top: `${Math.max(20, (window.innerHeight - defaultCardHeight) / 2)}px`, 
          left: `${Math.max(20, (window.innerWidth - defaultCardWidth) / 2)}px`
        };
    }
  };

  const { themeColors } = config;

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
              border: `2px solid ${themeColors.border.includes('cyan') ? 'rgba(6, 182, 212, 0.6)' : 
                       themeColors.border.includes('purple') ? 'rgba(168, 85, 247, 0.6)' :
                       themeColors.border.includes('emerald') ? 'rgba(16, 185, 129, 0.6)' :
                       themeColors.border.includes('amber') ? 'rgba(245, 158, 11, 0.6)' :
                       'rgba(59, 130, 246, 0.6)'}`,
            }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute z-50"
          style={{
            ...getCardPosition(),
            width: '340px',
            maxWidth: 'calc(100vw - 40px)'
          }}
        >
          <Card className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border ${themeColors.border} shadow-2xl ${themeColors.glow}`}>
            <CardContent className="p-0">
              <div className={`h-1 bg-gradient-to-r ${themeColors.primary} rounded-t-lg`} 
                   style={{ width: `${progress}%` }} />
              
              <div className="p-5">
                {isFirst && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 mb-3"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${themeColors.primary} flex items-center justify-center shadow-lg ${themeColors.glow}`}>
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold bg-gradient-to-r ${themeColors.primary} bg-clip-text text-transparent uppercase tracking-wider`}>
                        Hey {userName}!
                      </span>
                      <p className="text-[10px] text-slate-400">{config.greeting}</p>
                    </div>
                  </motion.div>
                )}

                <h3 className="text-lg font-bold text-white mb-2">
                  {currentStep?.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {currentStep?.description}
                </p>

                {isLast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${themeColors.secondary} rounded-lg p-3 mb-4 border ${themeColors.border}`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold">A note from Jason:</span> This was built based on what we understood about your role. If anything needs adjusting or you want to add features, just let us know!
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {steps.map((_, idx) => (
                      <motion.div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentStepIndex 
                            ? `w-6 bg-gradient-to-r ${themeColors.primary}` 
                            : idx < currentStepIndex 
                              ? `w-1.5 ${themeColors.secondary}` 
                              : 'w-1.5 bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {!isFirst && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrev}
                        className="text-slate-400 hover:text-white h-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className={`bg-gradient-to-r ${themeColors.primary} text-white hover:opacity-90 h-8 px-4 shadow-lg ${themeColors.glow}`}
                    >
                      {isLast ? (
                        <>
                          <Heart className="h-4 w-4 mr-1" />
                          Got it!
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <button
                  onClick={handleSkip}
                  className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
