import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function NotificationToast() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[NotificationToast] WebSocket connected');
      };

      wsRef.current.onclose = () => {
        console.log('[NotificationToast] WebSocket disconnected');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('[NotificationToast] WebSocket error:', error);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'EVENT_ACTIVATED') {
            const { eventName, activatedBy } = message.payload || {};
            toast.success(`Event '${eventName || 'Unknown'}' is now LIVE - activated by ${activatedBy || 'Unknown'}`, {
              duration: 6000,
              id: `event-activated-${Date.now()}`,
            });
          }

          if (message.type === 'DEPARTMENT_NOTE_ADDED') {
            const { department, note } = message.payload || {};
            toast.info(`New note for ${department || 'Unknown'}: ${note || ''}`, {
              duration: 5000,
              id: `dept-note-${Date.now()}`,
            });
          }
        } catch (error) {
          console.error('[NotificationToast] Failed to parse message:', error);
        }
      };
    } catch (error) {
      console.error('[NotificationToast] Failed to connect:', error);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return null;
}
