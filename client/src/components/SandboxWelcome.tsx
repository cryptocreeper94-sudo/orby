import { useState, useEffect } from 'react';
import { useMode } from '@/lib/ModeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FlaskConical, Rocket, Sparkles, Shield, Radio, Users } from 'lucide-react';

const WELCOME_SEEN_KEY = 'orby_sandbox_welcome_seen';

interface SandboxWelcomeProps {
  userName?: string;
  userRole?: string;
}

const ROLE_GREETINGS: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
  'Admin': {
    icon: <Shield className="h-6 w-6" />,
    title: "Welcome to Command, Administrator",
    description: "You have full access to explore all Orby features in this safe environment."
  },
  'Developer': {
    icon: <Rocket className="h-6 w-6" />,
    title: "Dev Sandbox Activated",
    description: "Test everything - emergency alerts, deliveries, messaging - without affecting live ops."
  },
  'ManagementCore': {
    icon: <Radio className="h-6 w-6" />,
    title: "Welcome to the Command Center",
    description: "Explore the operations dashboard and communication tools risk-free."
  },
  'StandSupervisor': {
    icon: <Users className="h-6 w-6" />,
    title: "Supervisor Training Mode",
    description: "Practice managing your section, handling requests, and coordinating with departments."
  },
  'CulinaryDirector': {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Kitchen Command Training",
    description: "Practice cook scheduling, stand assignments, and check-in tracking without affecting real operations."
  },
  'CulinaryCook': {
    icon: <Users className="h-6 w-6" />,
    title: "Cook Training Mode",
    description: "Practice checking in, viewing assignments, and using the culinary dashboard."
  },
  'BarManager': {
    icon: <FlaskConical className="h-6 w-6" />,
    title: "Bar Inventory Training",
    description: "Practice stock management, par levels, and inventory tracking without affecting real data."
  },
  'default': {
    icon: <FlaskConical className="h-6 w-6" />,
    title: "Welcome to Sandbox Mode",
    description: "This is a safe space to explore Orby without affecting real operations."
  }
};

export function SandboxWelcome({ userName, userRole }: SandboxWelcomeProps) {
  const { isSandbox } = useMode();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isSandbox) {
      const hasSeenWelcome = sessionStorage.getItem(WELCOME_SEEN_KEY);
      if (!hasSeenWelcome) {
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isSandbox]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem(WELCOME_SEEN_KEY, 'true');
  };

  const greeting = ROLE_GREETINGS[userRole || ''] || ROLE_GREETINGS['default'];

  if (!isSandbox) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border-cyan-500/30 max-w-md" data-testid="sandbox-welcome-dialog">
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.5 + 0.2
              }}
            />
          ))}
        </div>
        
        <DialogHeader className="relative">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                {greeting.icon}
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-xl text-center text-white">
            {greeting.title}
            {userName && <span className="block text-cyan-400 text-lg mt-1">{userName}</span>}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400 mt-2">
            {greeting.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-400 text-sm">✓</span>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">Safe to Experiment</div>
              <div className="text-xs text-slate-500">All actions are simulated - nothing affects live data</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">Demo Data Loaded</div>
              <div className="text-xs text-slate-500">Sample stands, deliveries, and alerts to explore</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 border-slate-600 text-slate-300"
            data-testid="button-explore-sandbox"
          >
            Explore
          </Button>
          <Button
            onClick={handleClose}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500"
            data-testid="button-start-tour"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Let's Go
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
