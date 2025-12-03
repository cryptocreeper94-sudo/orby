import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWA_PROMPT_DISMISSED_KEY = 'orby_pwa_prompt_dismissed';
const PWA_PROMPT_DELAY_MS = 3000;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem(PWA_PROMPT_DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      setTimeout(() => {
        setShowPrompt(true);
      }, PWA_PROMPT_DELAY_MS);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, String(Date.now()));
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        data-testid="pwa-install-prompt"
      >
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-4 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-cyan-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base mb-1">
                Add Orby to Home Screen
              </h3>
              <p className="text-slate-400 text-sm leading-snug">
                Install for quick access - works offline and launches instantly like a native app.
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-slate-500 hover:text-white transition-colors p-1"
              data-testid="button-dismiss-pwa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="flex-1 text-slate-400 hover:text-white hover:bg-white/10"
              data-testid="button-not-now"
            >
              Not Now
            </Button>
            <Button
              size="sm"
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium"
              data-testid="button-install-pwa"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
