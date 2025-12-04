import { useState, useEffect } from 'react';
import { useMode } from '@/lib/ModeContext';
import { FlaskConical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const BANNER_SHOWN_KEY = 'orby_sandbox_banner_shown';

export function SandboxBanner() {
  const { isSandbox } = useMode();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(BANNER_SHOWN_KEY);
    if (isSandbox && !alreadyShown) {
      setIsVisible(true);
      sessionStorage.setItem(BANNER_SHOWN_KEY, 'true');
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isSandbox]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-600 text-white px-4 py-2 shadow-lg shadow-cyan-500/30"
          data-testid="sandbox-banner"
        >
          <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
            <div className="relative">
              <FlaskConical className="h-5 w-5" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
            </div>
            <span className="font-bold text-sm">SANDBOX MODE</span>
            <span className="text-cyan-100 text-sm">- Demo data active</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SandboxStatusCard({ className }: { className?: string }) {
  const { isSandbox, exitSandbox } = useMode();

  if (!isSandbox) return null;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-cyan-500/50 bg-gradient-to-br from-cyan-950/80 to-teal-950/80 p-4",
      "shadow-[0_0_30px_rgba(6,182,212,0.2)]",
      className
    )} data-testid="sandbox-status-card">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
              <FlaskConical className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full" />
          </div>
          <div>
            <div className="font-bold text-cyan-300">Sandbox Mode Active</div>
            <div className="text-sm text-cyan-400/70">Demo data - safe to experiment</div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exitSandbox}
          className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
          data-testid="button-exit-sandbox-card"
        >
          Go Live
        </Button>
      </div>
    </div>
  );
}

export function SandboxStatusCompact() {
  const { isSandbox } = useMode();

  if (!isSandbox) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-medium" data-testid="sandbox-status-compact">
      <FlaskConical className="h-3 w-3" />
      <span>Sandbox</span>
    </div>
  );
}

export function SandboxBadge() {
  const { isSandbox } = useMode();

  if (!isSandbox) return null;

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" data-testid="sandbox-badge">
      Demo
    </span>
  );
}
