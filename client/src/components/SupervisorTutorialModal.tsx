import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  X,
  LayoutDashboard,
  MessageSquare,
  Truck,
  AlertTriangle,
  ChefHat,
  Package,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { isSupervisorTourComplete, setSupervisorTourComplete } from '@/lib/OnboardingContext';
import { useStore } from '@/lib/mockData';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips?: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Supervisor Dashboard',
    description: 'As a supervisor, you have access to powerful tools for managing your section of the venue. This tutorial will guide you through all the key features available to you.',
    icon: <Sparkles className="w-12 h-12 text-cyan-400" />,
    tips: [
      'Your dashboard is customized for supervisor-level access',
      'You can oversee multiple stands in your assigned section',
      'All actions are logged for accountability and tracking'
    ]
  },
  {
    id: 'stand-overview',
    title: 'Stand Overview',
    description: 'The stand status cards give you a real-time view of all stands in your section. Each card shows the current operational status - Open (green), Closed (gray), or Busy (yellow).',
    icon: <LayoutDashboard className="w-12 h-12 text-cyan-400" />,
    tips: [
      'Click on any stand card to view detailed information',
      'Status updates automatically as stands open/close',
      'Use the search bar to quickly find specific stands',
      'Stands are organized by section for easy navigation'
    ]
  },
  {
    id: 'team-communication',
    title: 'Team Communication',
    description: 'Stay connected with your team leads and staff through the integrated messaging system. Send quick messages, broadcast announcements, or request assistance.',
    icon: <MessageSquare className="w-12 h-12 text-cyan-400" />,
    tips: [
      'Use quick message templates for common communications',
      'Messages are prioritized by urgency level',
      'All messages are logged for accountability',
      'You can message individuals or broadcast to all staff'
    ]
  },
  {
    id: 'delivery-tracking',
    title: 'Delivery Tracking',
    description: 'Monitor all delivery requests from your stands to the warehouse. You can approve requests, track their status, and ensure timely fulfillment.',
    icon: <Truck className="w-12 h-12 text-cyan-400" />,
    tips: [
      'View pending, in-progress, and completed deliveries',
      'Set priority levels for urgent requests',
      'Receive notifications when deliveries are dispatched',
      'Track delivery times for performance monitoring'
    ]
  },
  {
    id: 'incident-reporting',
    title: 'Incident Reporting',
    description: 'Report and track incidents in your section. Whether it\'s a safety concern, equipment issue, or customer complaint, document everything for proper follow-up.',
    icon: <AlertTriangle className="w-12 h-12 text-cyan-400" />,
    tips: [
      'Report incidents with photos and detailed descriptions',
      'Track incident resolution status',
      'Generate incident reports for review',
      'Escalate urgent incidents to Ops Command'
    ]
  },
  {
    id: 'culinary-oversight',
    title: 'Culinary Oversight',
    description: 'As a supervisor, you have visibility into cook check-ins and assignments. Monitor kitchen staff attendance and ensure all culinary positions are covered.',
    icon: <ChefHat className="w-12 h-12 text-cyan-400" />,
    tips: [
      'View real-time cook check-in status',
      'See which stands have kitchen coverage',
      'Track no-shows and late arrivals',
      'Coordinate with the Culinary Director for staffing issues'
    ]
  },
  {
    id: 'inventory-access',
    title: 'Inventory Access',
    description: 'View bar and kitchen inventory levels across your stands. Monitor stock levels, identify low-stock items, and coordinate with the warehouse for replenishment.',
    icon: <Package className="w-12 h-12 text-cyan-400" />,
    tips: [
      'View current inventory levels by category',
      'Identify items below par levels',
      'Request emergency restocks when needed',
      'Review inventory variance reports'
    ]
  },
  {
    id: 'getting-help',
    title: 'Getting Help',
    description: 'Need assistance? You have multiple support options available. Contact Ops Command for urgent issues, use the AI assistant for quick answers, or access additional tutorials.',
    icon: <HelpCircle className="w-12 h-12 text-cyan-400" />,
    tips: [
      'Use the Help button in the header for quick access',
      'Contact Ops Command for emergency situations',
      'The AI assistant can answer common questions',
      'Review tutorials anytime from the Help menu'
    ]
  }
];

export default function SupervisorTutorialModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const currentUser = useStore((state) => state.currentUser);
  
  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    setSupervisorTourComplete();
    setCurrentStep(0);
    onClose();
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const welcomeTitle = currentStep === 0 
    ? `Welcome to Your Supervisor Dashboard, ${currentUser?.name?.split(' ')[0] || 'Supervisor'}!`
    : step.title;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl bg-slate-900 border border-cyan-500/30 p-0 overflow-hidden"
        data-testid="supervisor-tutorial-modal"
      >
        <div className="w-full h-1 bg-slate-800">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors z-10"
          data-testid="button-close-tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-4">
          <div className="flex justify-center gap-1.5 mb-6">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-cyan-400 scale-125' 
                    : index < currentStep 
                      ? 'bg-cyan-600' 
                      : 'bg-slate-600'
                }`}
                data-testid={`step-indicator-${index}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[320px]"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <h2 className="text-xl font-bold text-cyan-400 mb-2" data-testid="tutorial-step-title">
                  {welcomeTitle}
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </div>

              {step.tips && step.tips.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Quick Tips
                  </h3>
                  <ul className="space-y-2">
                    {step.tips.map((tip, index) => (
                      <li 
                        key={index}
                        className="text-sm text-slate-400 flex items-start gap-2"
                      >
                        <span className="text-cyan-500 mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirstStep}
              className="text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
              data-testid="button-prev-step"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm text-slate-500">
              {currentStep + 1} of {tutorialSteps.length}
            </span>

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
                data-testid="button-complete-tutorial"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete Tutorial
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
                data-testid="button-next-step"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
