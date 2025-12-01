import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Mode = 'live' | 'sandbox';

interface ModeContextType {
  mode: Mode;
  isSandbox: boolean;
  isLive: boolean;
  enterSandbox: (returnPath?: string) => void;
  exitSandbox: () => void;
  toggleMode: () => void;
  returnPath: string | null;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const STORAGE_KEY = 'orby_mode';
const RETURN_PATH_KEY = 'orby_sandbox_return';

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('live');
  const [returnPath, setReturnPath] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlMode = urlParams.get('mode');
    
    if (urlMode === 'sandbox') {
      setMode('sandbox');
      sessionStorage.setItem(STORAGE_KEY, 'sandbox');
    } else {
      const storedMode = sessionStorage.getItem(STORAGE_KEY) as Mode | null;
      if (storedMode === 'sandbox' || storedMode === 'live') {
        setMode(storedMode);
      }
    }

    const storedReturnPath = sessionStorage.getItem(RETURN_PATH_KEY);
    if (storedReturnPath) {
      setReturnPath(storedReturnPath);
    }
  }, []);

  const enterSandbox = useCallback((returnPathParam?: string) => {
    setMode('sandbox');
    sessionStorage.setItem(STORAGE_KEY, 'sandbox');
    
    if (returnPathParam) {
      setReturnPath(returnPathParam);
      sessionStorage.setItem(RETURN_PATH_KEY, returnPathParam);
    }
  }, []);

  const exitSandbox = useCallback(() => {
    setMode('live');
    sessionStorage.setItem(STORAGE_KEY, 'live');
    sessionStorage.removeItem(RETURN_PATH_KEY);
    setReturnPath(null);
  }, []);

  const toggleMode = useCallback(() => {
    if (mode === 'live') {
      enterSandbox(window.location.pathname);
    } else {
      exitSandbox();
    }
  }, [mode, enterSandbox, exitSandbox]);

  const value: ModeContextType = {
    mode,
    isSandbox: mode === 'sandbox',
    isLive: mode === 'live',
    enterSandbox,
    exitSandbox,
    toggleMode,
    returnPath
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
