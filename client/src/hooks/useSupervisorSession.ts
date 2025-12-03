import { useEffect, useRef, useCallback } from 'react';
import { useMode } from '@/lib/ModeContext';

interface SessionData {
  sessionId: string | null;
  supervisorId: string;
  supervisorName: string;
}

interface SupervisorSessionOptions {
  supervisorId: string;
  supervisorName: string;
  currentStandId?: string | null;
  currentStandName?: string | null;
  currentSection?: string | null;
}

type ActivityKind = 
  | 'login' | 'logout' | 'stand_selected' | 'tab_changed' 
  | 'delivery_requested' | 'issue_opened' | 'issue_resolved' 
  | 'count_started' | 'count_completed' | 'message_sent' 
  | 'compliance_submitted' | 'facility_issue' | 'emergency_alert';

export function useSupervisorSession(options: SupervisorSessionOptions) {
  const { isSandbox } = useMode();
  const sessionRef = useRef<SessionData | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const currentTabRef = useRef<string>('overview');

  const createSession = useCallback(async () => {
    try {
      const response = await fetch('/api/supervisor-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorId: options.supervisorId,
          supervisorName: options.supervisorName,
          currentStandId: options.currentStandId || null,
          currentStandName: options.currentStandName || null,
          currentSection: options.currentSection || null,
          status: 'online',
          currentTab: currentTabRef.current,
          isSandbox
        })
      });

      if (response.ok) {
        const data = await response.json();
        sessionRef.current = {
          sessionId: data.id,
          supervisorId: options.supervisorId,
          supervisorName: options.supervisorName
        };
        
        await logActivity('login', 'Signed into Supervisor Dashboard');
        return data.id;
      }
    } catch (error) {
      console.error('Failed to create supervisor session:', error);
    }
    return null;
  }, [options.supervisorId, options.supervisorName, options.currentStandId, options.currentStandName, options.currentSection, isSandbox]);

  const sendHeartbeat = useCallback(async (updates?: {
    currentStandId?: string | null;
    currentStandName?: string | null;
    currentSection?: string | null;
    currentTab?: string;
    status?: 'online' | 'away' | 'busy';
  }) => {
    if (!sessionRef.current?.sessionId) return;
    
    try {
      await fetch(`/api/supervisor-sessions/${sessionRef.current.sessionId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates || {})
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!sessionRef.current?.sessionId) return;
    
    try {
      await logActivity('logout', 'Signed out of Supervisor Dashboard');
      
      await fetch(`/api/supervisor-sessions/${sessionRef.current.sessionId}/end`, {
        method: 'POST'
      });
      
      sessionRef.current = null;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, []);

  const logActivity = useCallback(async (
    kind: ActivityKind, 
    description?: string,
    standId?: string | null,
    standName?: string | null,
    metadata?: Record<string, unknown>
  ) => {
    if (!sessionRef.current?.sessionId) return;
    
    try {
      await fetch('/api/supervisor-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionRef.current.sessionId,
          supervisorId: sessionRef.current.supervisorId,
          supervisorName: sessionRef.current.supervisorName,
          kind,
          description,
          standId: standId || options.currentStandId || null,
          standName: standName || options.currentStandName || null,
          metadata
        })
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, [options.currentStandId, options.currentStandName]);

  const updateTab = useCallback((tabName: string) => {
    currentTabRef.current = tabName;
    sendHeartbeat({ currentTab: tabName });
    logActivity('tab_changed', `Viewing ${tabName}`);
  }, [sendHeartbeat, logActivity]);

  const updateStand = useCallback((standId: string | null, standName: string | null, section?: string | null) => {
    sendHeartbeat({ 
      currentStandId: standId, 
      currentStandName: standName,
      currentSection: section || null
    });
    if (standId && standName) {
      logActivity('stand_selected', `Selected ${standName}`, standId, standName);
    }
  }, [sendHeartbeat, logActivity]);

  const updateStatus = useCallback((status: 'online' | 'away' | 'busy') => {
    sendHeartbeat({ status });
  }, [sendHeartbeat]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      await createSession();
      
      heartbeatRef.current = setInterval(() => {
        if (mounted) {
          sendHeartbeat();
        }
      }, 30000);
    };

    init();

    const handleBeforeUnload = () => {
      if (sessionRef.current?.sessionId) {
        navigator.sendBeacon(
          `/api/supervisor-sessions/${sessionRef.current.sessionId}/end`,
          JSON.stringify({})
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateStatus('away');
      } else {
        updateStatus('online');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      endSession();
    };
  }, [createSession, sendHeartbeat, endSession, updateStatus]);

  return {
    sessionId: sessionRef.current?.sessionId || null,
    logActivity,
    updateTab,
    updateStand,
    updateStatus,
    sendHeartbeat
  };
}
