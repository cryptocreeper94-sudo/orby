import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { ActiveEvent } from '@shared/schema';

type Mode = 'live' | 'sandbox';

interface SystemStatus {
  isLive: boolean;
  mode: Mode;
  activeEvent: ActiveEvent | null;
  message: string;
}

interface ModeContextType {
  mode: Mode;
  isSandbox: boolean;
  isLive: boolean;
  isEventActive: boolean;
  activeEvent: ActiveEvent | null;
  systemMessage: string;
  enterSandbox: (returnPath?: string) => void;
  exitSandbox: () => void;
  toggleMode: () => void;
  returnPath: string | null;
  refreshSystemStatus: () => Promise<void>;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const STORAGE_KEY = 'orby_mode';
const RETURN_PATH_KEY = 'orby_sandbox_return';
const WELCOME_SEEN_KEY = 'orby_sandbox_welcome_seen';

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('sandbox');
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isLive: false,
    mode: 'sandbox',
    activeEvent: null,
    message: 'System is in SANDBOX mode'
  });

  const fetchSystemStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system-status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
        if (!data.isLive) {
          setMode('sandbox');
          sessionStorage.setItem(STORAGE_KEY, 'sandbox');
        }
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  }, []);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlMode = urlParams.get('mode');
    
    if (urlMode === 'sandbox') {
      setMode('sandbox');
      sessionStorage.setItem(STORAGE_KEY, 'sandbox');
    } else if (systemStatus.isLive) {
      const storedMode = sessionStorage.getItem(STORAGE_KEY) as Mode | null;
      if (storedMode === 'sandbox') {
        setMode('sandbox');
      } else {
        setMode('live');
      }
    }

    const storedReturnPath = sessionStorage.getItem(RETURN_PATH_KEY);
    if (storedReturnPath) {
      setReturnPath(storedReturnPath);
    }
  }, [systemStatus.isLive]);

  const enterSandbox = useCallback((returnPathParam?: string) => {
    setMode('sandbox');
    sessionStorage.setItem(STORAGE_KEY, 'sandbox');
    
    if (returnPathParam) {
      setReturnPath(returnPathParam);
      sessionStorage.setItem(RETURN_PATH_KEY, returnPathParam);
    }
  }, []);

  const exitSandbox = useCallback(() => {
    if (systemStatus.isLive) {
      setMode('live');
      sessionStorage.setItem(STORAGE_KEY, 'live');
    } else {
      console.warn('Cannot exit sandbox mode - no active event');
    }
    sessionStorage.removeItem(RETURN_PATH_KEY);
    sessionStorage.removeItem(WELCOME_SEEN_KEY);
    setReturnPath(null);
  }, [systemStatus.isLive]);

  const toggleMode = useCallback(() => {
    if (mode === 'live') {
      enterSandbox(window.location.pathname);
    } else {
      exitSandbox();
    }
  }, [mode, enterSandbox, exitSandbox]);

  const effectiveIsLive = mode === 'live' && systemStatus.isLive;

  const value: ModeContextType = {
    mode,
    isSandbox: !effectiveIsLive,
    isLive: effectiveIsLive,
    isEventActive: systemStatus.isLive,
    activeEvent: systemStatus.activeEvent,
    systemMessage: systemStatus.message,
    enterSandbox,
    exitSandbox,
    toggleMode,
    returnPath,
    refreshSystemStatus: fetchSystemStatus
  };

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
