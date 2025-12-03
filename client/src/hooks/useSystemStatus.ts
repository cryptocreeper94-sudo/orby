import { useState, useEffect, useCallback } from 'react';
import type { ActiveEvent } from '@shared/schema';

interface SystemStatus {
  isLive: boolean;
  mode: 'live' | 'sandbox';
  activeEvent: ActiveEvent | null;
  message: string;
}

export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isLive: false,
    mode: 'sandbox',
    activeEvent: null,
    message: 'Loading...'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system-status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
        setError(null);
      } else {
        setError('Failed to fetch system status');
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    ...systemStatus,
    isLoading,
    error,
    refresh: fetchStatus
  };
}
