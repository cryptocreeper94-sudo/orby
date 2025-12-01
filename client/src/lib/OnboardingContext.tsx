import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useMode } from './ModeContext';

export interface OnboardingStep {
  id: string;
  page: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  liveRoute?: string;
  sandboxRoute?: string;
  linkText?: string;
}

export interface OnboardingPage {
  id: string;
  title: string;
  icon: string;
  description: string;
  route: string;
  sandboxRoute?: string;
  steps: OnboardingStep[];
}

const ONBOARDING_PROGRESS_KEY = 'orby_onboarding_progress';
const ONBOARDING_COMPLETE_KEY = 'orby_onboarding_complete';

interface OnboardingProgress {
  currentPageIndex: number;
  currentStepIndex: number;
  completedPages: string[];
  startedAt: string;
  lastVisitedAt: string;
}

interface OnboardingContextType {
  isOnboarding: boolean;
  isComplete: boolean;
  currentPage: OnboardingPage | null;
  currentStep: OnboardingStep | null;
  currentPageIndex: number;
  currentStepIndex: number;
  totalPages: number;
  totalSteps: number;
  progress: number;
  startOnboarding: () => void;
  pauseOnboarding: () => void;
  resumeOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipToPage: (pageIndex: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  openSlideshow: () => void;
  closeSlideshow: () => void;
  isSlideshowOpen: boolean;
  getRouteForCurrentMode: (step: OnboardingStep) => string;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const onboardingPages: OnboardingPage[] = [
  {
    id: 'welcome',
    title: 'Welcome to Orby',
    icon: '🌐',
    description: 'Your operations communication platform for venue management',
    route: '/',
    steps: [
      {
        id: 'welcome-intro',
        page: 'welcome',
        title: 'Welcome to Orby!',
        description: 'Orby replaces radios, texts, and phone calls with smart, trackable communication for your entire venue.',
        position: 'center'
      },
      {
        id: 'welcome-login',
        page: 'welcome',
        title: 'Quick PIN Login',
        description: 'Enter your 4-digit PIN to access your personalized dashboard. Each role sees exactly what they need.',
        targetSelector: '[data-testid="pin-input"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'dev-dashboard',
    title: 'Developer Dashboard',
    icon: '🛠️',
    description: 'Your command center for managing the entire platform',
    route: '/dev',
    steps: [
      {
        id: 'dev-overview',
        page: 'dev-dashboard',
        title: 'Developer Dashboard',
        description: 'This is your command center. You have full visibility into all operations, stands, and communications.',
        position: 'center'
      },
      {
        id: 'dev-sandbox-toggle',
        page: 'dev-dashboard',
        title: 'Sandbox Mode Toggle',
        description: 'Switch between Live and Sandbox mode. Sandbox lets you explore with demo data without affecting real operations.',
        targetSelector: '[data-testid="button-enter-sandbox"], [data-testid="button-exit-sandbox"]',
        position: 'bottom'
      },
      {
        id: 'dev-nav',
        page: 'dev-dashboard',
        title: 'Quick Navigation',
        description: 'Access Command Center, Reporting, Warehouse, and other key areas from the navigation cards.',
        targetSelector: '[data-testid="button-command-center"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'command-center',
    title: 'Command Center',
    icon: '🚨',
    description: 'Real-time emergency alerts and delivery tracking',
    route: '/command-center',
    sandboxRoute: '/command-center?mode=sandbox',
    steps: [
      {
        id: 'command-overview',
        page: 'command-center',
        title: 'Emergency Command Center',
        description: 'Monitor all active emergencies and deliveries in real-time. One-tap alerts notify the right teams instantly.',
        position: 'center'
      },
      {
        id: 'command-alerts',
        page: 'command-center',
        title: 'Active Alerts',
        description: 'See all active emergency alerts at a glance. Color-coded by priority - red is critical, yellow needs attention.',
        targetSelector: '[data-testid="tab-active"]',
        position: 'bottom'
      },
      {
        id: 'command-quick-alert',
        page: 'command-center',
        title: 'Quick Alert Buttons',
        description: 'One tap to send common alerts: Medical, Security, Spill, Equipment Down. The right team is notified instantly.',
        targetSelector: '[data-testid="button-quick-medical"]',
        position: 'top'
      }
    ]
  },
  {
    id: 'reporting',
    title: 'Reporting Dashboard',
    icon: '📊',
    description: 'Unified analytics and audit trail',
    route: '/reports',
    sandboxRoute: '/reports?mode=sandbox',
    steps: [
      {
        id: 'reporting-overview',
        page: 'reporting',
        title: 'Reporting Dashboard',
        description: 'Your unified view of all operations data. Deliveries, emergencies, messages, and full audit trail.',
        position: 'center'
      },
      {
        id: 'reporting-nav',
        page: 'reporting',
        title: 'Navigation',
        description: 'Use the sidebar to navigate between different report sections.',
        targetSelector: '[data-testid="nav-deliveries"], [data-testid="button-refresh"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'sandbox',
    title: 'Sandbox Mode',
    icon: '🎮',
    description: 'Safe training and demo environment',
    route: '/dev?mode=sandbox',
    steps: [
      {
        id: 'sandbox-intro',
        page: 'sandbox',
        title: 'Sandbox Mode',
        description: 'Sandbox mode uses realistic demo data so you can explore every feature without affecting live operations.',
        position: 'center'
      },
      {
        id: 'sandbox-banner',
        page: 'sandbox',
        title: 'Sandbox Indicator',
        description: 'When in Sandbox, you\'ll see this banner at the top. All data is demo data - nothing affects your real operations.',
        position: 'center'
      },
      {
        id: 'sandbox-exit',
        page: 'sandbox',
        title: 'Exiting Sandbox',
        description: 'Click "Exit Sandbox" to return to live mode, or toggle off from the Dev Dashboard.',
        targetSelector: '[data-testid="button-exit-sandbox"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    icon: '🎉',
    description: 'Tour complete - explore on your own',
    route: '/dev',
    steps: [
      {
        id: 'complete-congrats',
        page: 'complete',
        title: 'Tour Complete!',
        description: 'You\'ve seen the key features of Orby. You can always access this guide again from the Help button.',
        position: 'center'
      },
      {
        id: 'complete-help',
        page: 'complete',
        title: 'Need Help Later?',
        description: 'Tap the Help button anytime to open the feature slideshow and quickly navigate to any area.',
        targetSelector: '[data-testid="help-button"]',
        position: 'left'
      }
    ]
  }
];

function getStoredProgress(): OnboardingProgress | null {
  try {
    const stored = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveProgress(progress: OnboardingProgress) {
  localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(progress));
}

function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
}

function setOnboardingComplete() {
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

function clearOnboardingComplete() {
  localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { isSandbox } = useMode();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  const totalPages = onboardingPages.length;
  const currentPage = onboardingPages[currentPageIndex] || null;
  const currentStep = currentPage?.steps[currentStepIndex] || null;
  const totalSteps = onboardingPages.reduce((sum, p) => sum + p.steps.length, 0);
  
  const completedSteps = onboardingPages
    .slice(0, currentPageIndex)
    .reduce((sum, p) => sum + p.steps.length, 0) + currentStepIndex;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  useEffect(() => {
    const complete = isOnboardingComplete();
    setIsComplete(complete);

    if (!complete) {
      const stored = getStoredProgress();
      if (stored) {
        setCurrentPageIndex(stored.currentPageIndex);
        setCurrentStepIndex(stored.currentStepIndex);
        const timer = setTimeout(() => {
          setIsOnboarding(true);
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setIsOnboarding(true);
          saveProgress({
            currentPageIndex: 0,
            currentStepIndex: 0,
            completedPages: [],
            startedAt: new Date().toISOString(),
            lastVisitedAt: new Date().toISOString()
          });
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const persistProgress = useCallback(() => {
    saveProgress({
      currentPageIndex,
      currentStepIndex,
      completedPages: onboardingPages.slice(0, currentPageIndex).map(p => p.id),
      startedAt: getStoredProgress()?.startedAt || new Date().toISOString(),
      lastVisitedAt: new Date().toISOString()
    });
  }, [currentPageIndex, currentStepIndex]);

  useEffect(() => {
    if (isOnboarding) {
      persistProgress();
    }
  }, [isOnboarding, currentPageIndex, currentStepIndex, persistProgress]);

  const startOnboarding = useCallback(() => {
    setCurrentPageIndex(0);
    setCurrentStepIndex(0);
    setIsOnboarding(true);
    setIsComplete(false);
    clearOnboardingComplete();
  }, []);

  const pauseOnboarding = useCallback(() => {
    setIsOnboarding(false);
  }, []);

  const resumeOnboarding = useCallback(() => {
    setIsOnboarding(true);
  }, []);

  const nextStep = useCallback(() => {
    const page = onboardingPages[currentPageIndex];
    if (!page) return;

    if (currentStepIndex < page.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentPageIndex < onboardingPages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    } else {
      setOnboardingComplete();
      setIsComplete(true);
      setIsOnboarding(false);
    }
  }, [currentPageIndex, currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else if (currentPageIndex > 0) {
      const prevPage = onboardingPages[currentPageIndex - 1];
      setCurrentPageIndex(prev => prev - 1);
      setCurrentStepIndex(prevPage.steps.length - 1);
    }
  }, [currentPageIndex, currentStepIndex]);

  const skipToPage = useCallback((pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < onboardingPages.length) {
      setCurrentPageIndex(pageIndex);
      setCurrentStepIndex(0);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete();
    setIsComplete(true);
    setIsOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    clearOnboardingComplete();
    setCurrentPageIndex(0);
    setCurrentStepIndex(0);
    setIsComplete(false);
    setIsOnboarding(true);
  }, []);

  const openSlideshow = useCallback(() => {
    setIsSlideshowOpen(true);
  }, []);

  const closeSlideshow = useCallback(() => {
    setIsSlideshowOpen(false);
  }, []);

  const getRouteForCurrentMode = useCallback((step: OnboardingStep): string => {
    if (isSandbox && step.sandboxRoute) {
      return step.sandboxRoute;
    }
    return step.liveRoute || onboardingPages.find(p => p.id === step.page)?.route || '/';
  }, [isSandbox]);

  const value: OnboardingContextType = {
    isOnboarding,
    isComplete,
    currentPage,
    currentStep,
    currentPageIndex,
    currentStepIndex,
    totalPages,
    totalSteps,
    progress,
    startOnboarding,
    pauseOnboarding,
    resumeOnboarding,
    nextStep,
    prevStep,
    skipToPage,
    completeOnboarding,
    resetOnboarding,
    openSlideshow,
    closeSlideshow,
    isSlideshowOpen,
    getRouteForCurrentMode
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
