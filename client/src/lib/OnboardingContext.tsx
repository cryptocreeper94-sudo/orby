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
const OPS_MANAGER_TOUR_KEY = 'orby_ops_manager_tour_complete';
const OPS_MANAGER_TOUR_PENDING_KEY = 'orby_ops_manager_tour_pending';
const HR_ADMIN_TOUR_KEY = 'orby_hr_admin_tour_complete';
const HR_ADMIN_TOUR_PENDING_KEY = 'orby_hr_admin_tour_pending';

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

export const opsManagerPages: OnboardingPage[] = [
  {
    id: 'ops-welcome',
    title: 'Ops Manager Command',
    icon: '👑',
    description: 'Your control center for all venue operations',
    route: '/command-center',
    steps: [
      {
        id: 'ops-intro',
        page: 'ops-welcome',
        title: 'Welcome, David!',
        description: 'As Ops Manager, you have full visibility and control over all venue operations. This tour covers your superpowers. It\'s thorough but quick.',
        position: 'center'
      }
    ]
  },
  {
    id: 'ops-controls',
    title: 'Dashboard Controls',
    icon: '⚙️',
    description: 'Your superpower - control what everyone sees',
    route: '/command-center',
    steps: [
      {
        id: 'controls-access',
        page: 'ops-controls',
        title: 'Dashboard Controls (Your Superpower)',
        description: 'Only YOU can access this. Toggle widgets per role, set alert levels, control data scope. Changes apply instantly across all dashboards.',
        targetSelector: '[data-testid="button-dashboard-controls"]',
        position: 'bottom'
      },
      {
        id: 'controls-widgets',
        page: 'ops-controls',
        title: 'Widget Visibility',
        description: 'Control what each role sees: Emergency Feed, Deliveries, Compliance, AI Chat, Weather, Map, Messaging, Inventory.',
        position: 'center'
      },
      {
        id: 'controls-alerts',
        page: 'ops-controls',
        title: 'Alert Levels',
        description: 'Set notification levels per role: Normal (all), Priority-Only, or Silent. Manage noise during high-traffic events.',
        position: 'center'
      },
      {
        id: 'controls-geofence',
        page: 'ops-controls',
        title: 'Venue Geofencing',
        description: 'Configure geofence radius: Standard (1,640ft), Large Event (2,461ft), CMA Festival (4,921ft). Only you and Jason can change this.',
        position: 'center'
      }
    ]
  },
  {
    id: 'ops-integrations',
    title: 'System Integrations',
    icon: '🔗',
    description: 'Unified view of all connected systems',
    route: '/command-center',
    steps: [
      {
        id: 'integration-hub',
        page: 'ops-integrations',
        title: 'Integration Hub',
        description: 'One dashboard for PAX Systems (A930, A700), Yellow Dog Inventory, and OrbitStaffing. No more switching between 4-5 screens.',
        targetSelector: '[data-testid="button-quick-integrations"]',
        position: 'bottom'
      },
      {
        id: 'pos-tracker',
        page: 'ops-integrations',
        title: 'POS Device Tracker',
        description: 'Track all POS terminals. IT manages assignments. You see the full grid and can message IT about issues.',
        targetSelector: '[data-testid="button-quick-pos"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'ops-culinary',
    title: 'Culinary Operations',
    icon: '👨‍🍳',
    description: 'Kitchen team management and scheduling',
    route: '/command-center',
    steps: [
      {
        id: 'culinary-team',
        page: 'ops-culinary',
        title: 'Culinary Team Management',
        description: 'Chef Deb (PIN 3737) manages cook scheduling. Shelia (4545) has supervisor oversight. See cook assignments, check-ins, and no-shows in real-time.',
        position: 'center'
      },
      {
        id: 'culinary-panel',
        page: 'ops-culinary',
        title: 'Culinary Visibility Panel',
        description: 'The Ops Command Center shows cook check-in status by stand. Green = checked in, gray = not yet, red = no-show. Real-time updates.',
        targetSelector: '[data-testid="section-culinary-team"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'ops-inventory',
    title: 'Department Inventory',
    icon: '📦',
    description: 'Bar and Kitchen stock tracking',
    route: '/command-center',
    steps: [
      {
        id: 'inventory-control',
        page: 'ops-inventory',
        title: 'Department Inventory Control',
        description: 'Darby (PIN 4646) manages Bar inventory. Chef Deb handles Kitchen. Track liquor, mixers, ingredients by location with par levels and variances.',
        position: 'center'
      },
      {
        id: 'inventory-integration',
        page: 'ops-inventory',
        title: 'Yellow Dog & PAX Integration',
        description: 'Integration-ready for Yellow Dog inventory sync and PAX Pay POS data. When connected, sales automatically deduct from stock levels.',
        position: 'center'
      }
    ]
  },
  {
    id: 'ops-emergency',
    title: 'Emergency Command',
    icon: '🚨',
    description: 'Real-time alerts with SLA tracking',
    route: '/command-center',
    steps: [
      {
        id: 'emergency-center',
        page: 'ops-emergency',
        title: 'Emergency Command Center',
        description: 'Real-time alerts with SLA tracking. One-tap for Medical, Security, Fire, Equipment, Weather, or Crowd alerts. Right teams notified instantly.',
        position: 'center'
      },
      {
        id: 'compliance-alerts',
        page: 'ops-emergency',
        title: 'Compliance Alerts',
        description: 'Tennessee ABC Board and Health Department alerts. Inspector arrivals trigger system-wide notifications with checklists.',
        targetSelector: '[data-testid="button-quick-compliance"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'ops-assets',
    title: 'Genesis Hallmark',
    icon: '🔐',
    description: 'Blockchain-certified asset tracking',
    route: '/command-center',
    steps: [
      {
        id: 'asset-tracker',
        page: 'ops-assets',
        title: 'Genesis Hallmark System',
        description: 'Every auditable asset gets an ORB number (ORB-000000000001 format). Search by number, name, date, type. Important docs anchored to blockchain.',
        targetSelector: '[data-testid="button-quick-assets"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'ops-roles',
    title: 'Role Hierarchy',
    icon: '👥',
    description: 'How the team structure works',
    route: '/command-center',
    steps: [
      {
        id: 'role-overview',
        page: 'ops-roles',
        title: 'Role Overview',
        description: 'NPO Workers handle counts. Stand Leads oversee NPOs. Supervisors manage sections. Managers handle department docs. You see and control it all.',
        position: 'center'
      },
      {
        id: 'messaging-flow',
        page: 'ops-roles',
        title: 'Smart Messaging',
        description: 'Messages auto-route to the right department. You can message any role: IT, Warehouse, Kitchen, Bar, Operations, HR. Full audit trail.',
        position: 'center'
      }
    ]
  },
  {
    id: 'ops-docs',
    title: 'Documents & Reports',
    icon: '📄',
    description: 'Central archive for all operations',
    route: '/command-center',
    steps: [
      {
        id: 'document-hub',
        page: 'ops-docs',
        title: 'Document Hub',
        description: 'Central archive: closing checklists, spoilage logs, variance reports, compliance docs. Searchable by date/stand/category. All as PDFs.',
        position: 'center'
      },
      {
        id: 'report-builder',
        page: 'ops-docs',
        title: 'Event Report Builder',
        description: 'Pete\'s game-changer: Build combined PDF packages by event date. Finance Package, Compliance Package, or Custom. Count sheets with item tables, variance data, incidents - all in one download.',
        position: 'center'
      },
      {
        id: 'audit-trail',
        page: 'ops-docs',
        title: 'Full Audit Trail',
        description: 'Every action logged. Deliveries, emergencies, inventory, messages. Complete accountability for all venue operations.',
        position: 'center'
      }
    ]
  },
  {
    id: 'ops-feedback',
    title: 'Beta Feedback',
    icon: '📢',
    description: 'Help shape the product',
    route: '/command-center',
    steps: [
      {
        id: 'report-issues',
        page: 'ops-feedback',
        title: 'Report Issues to Jason',
        description: 'See something wrong? Tell Jason immediately. He\'ll fix it on the spot. This is beta - your feedback shapes the product.',
        position: 'center'
      },
      {
        id: 'tour-complete',
        page: 'ops-feedback',
        title: 'You\'re Ready!',
        description: 'Access this tour anytime from Help button. All pages have contextual help. Let\'s make operations seamless. Welcome to Orby, David.',
        position: 'center'
      }
    ]
  }
];

export const hrAdminPages: OnboardingPage[] = [
  {
    id: 'hr-welcome',
    title: 'Welcome KD',
    icon: '👋',
    description: 'Your HR Admin Dashboard Overview',
    route: '/admin',
    steps: [
      {
        id: 'hr-intro',
        page: 'hr-welcome',
        title: 'Welcome to Your Dashboard, KD!',
        description: 'This is your command center for HR operations. Let me show you how everything works.',
        position: 'center'
      },
      {
        id: 'hr-mode-bar',
        page: 'hr-welcome',
        title: 'Mode Bar',
        description: 'The top bar shows whether you\'re in Live or Sandbox mode. Sandbox is for training - nothing you do there affects real data.',
        targetSelector: '[data-testid^="global-mode-bar"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'hr-navigation',
    title: 'Dashboard Navigation',
    icon: '🗂️',
    description: 'How to move around the dashboard',
    route: '/admin',
    steps: [
      {
        id: 'hr-tabs',
        page: 'hr-navigation',
        title: 'View Tabs',
        description: 'Switch between Grid View (staffing assignments), List View, Reports, and Stadium Map using these tabs.',
        targetSelector: '[data-testid="tab-grid"]',
        position: 'bottom'
      },
      {
        id: 'hr-staffing-grid',
        page: 'hr-navigation',
        title: 'Staffing Grid',
        description: 'This grid shows all stands and their assigned staff. You can see who\'s working where at a glance.',
        position: 'center'
      },
      {
        id: 'hr-map-view',
        page: 'hr-navigation',
        title: 'Stadium Map',
        description: 'The Map tab shows an interactive stadium layout. Tap any stand to see details and staff.',
        targetSelector: '[data-testid="tab-map"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'hr-communication',
    title: 'Communication',
    icon: '💬',
    description: 'How to message anyone in the venue',
    route: '/admin',
    steps: [
      {
        id: 'hr-messages',
        page: 'hr-communication',
        title: 'Messages',
        description: 'Tap this to access messages. You have full communication privileges - you can message any role: NPO groups, Check-in Staff, Supervisors, Managers, IT, everyone.',
        targetSelector: '[data-testid="button-messages"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'hr-role-toggle',
    title: 'Dual Role Mode',
    icon: '🔄',
    description: 'Switching between HR Admin and Supervisor',
    route: '/admin',
    steps: [
      {
        id: 'hr-dual-role',
        page: 'hr-role-toggle',
        title: 'Your Dual Role',
        description: 'You have two roles: HR Admin (your current view) and Stand Supervisor for event days. When the role toggle is available, you can switch between them.',
        position: 'center'
      },
      {
        id: 'hr-supervisor-mode',
        page: 'hr-role-toggle',
        title: 'Supervisor Mode',
        description: 'In Supervisor mode, you\'ll see the closing checklist, stand assignments, and field-level controls. Perfect for hands-on event day work.',
        position: 'center'
      }
    ]
  },
  {
    id: 'hr-complete',
    title: 'Ready to Go',
    icon: '✅',
    description: 'You\'re all set',
    route: '/admin',
    steps: [
      {
        id: 'hr-help',
        page: 'hr-complete',
        title: 'Need Help?',
        description: 'Look for the Help button on any page to replay tutorials or get contextual guidance.',
        position: 'center'
      },
      {
        id: 'hr-tour-done',
        page: 'hr-complete',
        title: 'You\'re Ready!',
        description: 'That\'s your dashboard! You can access this tour anytime from the Help button. Welcome to Orby, KD!',
        position: 'center'
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

function isOpsManagerTourComplete(): boolean {
  return localStorage.getItem(OPS_MANAGER_TOUR_KEY) === 'true';
}

function setOpsManagerTourComplete() {
  localStorage.setItem(OPS_MANAGER_TOUR_KEY, 'true');
  localStorage.removeItem(OPS_MANAGER_TOUR_PENDING_KEY);
}

export function scheduleOpsManagerTour() {
  // Only schedule if not already completed AND not already pending
  if (!isOpsManagerTourComplete() && !localStorage.getItem(OPS_MANAGER_TOUR_PENDING_KEY)) {
    localStorage.setItem(OPS_MANAGER_TOUR_PENDING_KEY, 'true');
  }
}

export function isOpsManagerTourPending(): boolean {
  return localStorage.getItem(OPS_MANAGER_TOUR_PENDING_KEY) === 'true' && !isOpsManagerTourComplete();
}

function isHRAdminTourComplete(): boolean {
  return localStorage.getItem(HR_ADMIN_TOUR_KEY) === 'true';
}

export function scheduleHRAdminTour() {
  // Only schedule if not already completed AND not already pending
  if (!isHRAdminTourComplete() && !localStorage.getItem(HR_ADMIN_TOUR_PENDING_KEY)) {
    localStorage.setItem(HR_ADMIN_TOUR_PENDING_KEY, 'true');
  }
}

export function isHRAdminTourPending(): boolean {
  return localStorage.getItem(HR_ADMIN_TOUR_PENDING_KEY) === 'true' && !isHRAdminTourComplete();
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
