import { useEffect, useRef, useState, useCallback } from 'react';
import { create } from 'zustand';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface DeliveryUpdate {
  id: string;
  standId: string;
  status: string;
  department: string;
  priority: string;
  description: string;
  eta?: number;
  requesterId: string;
  createdAt: string;
  updatedAt: string;
}

interface EmergencyAlert {
  id: string;
  alertType: string;
  title: string;
  description: string;
  standId?: string;
  reporterId: string;
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface OnlineUser {
  id: string;
  name: string;
  role: string;
  standId?: string;
  connectedAt: string;
}

interface WebSocketStore {
  isConnected: boolean;
  deliveries: DeliveryUpdate[];
  emergencies: EmergencyAlert[];
  onlineUsers: OnlineUser[];
  messages: any[];
  setConnected: (connected: boolean) => void;
  addDelivery: (delivery: DeliveryUpdate) => void;
  updateDelivery: (delivery: DeliveryUpdate) => void;
  addEmergency: (alert: EmergencyAlert) => void;
  updateEmergency: (alert: EmergencyAlert) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  addMessage: (message: any) => void;
  setDeliveries: (deliveries: DeliveryUpdate[]) => void;
  setEmergencies: (alerts: EmergencyAlert[]) => void;
}

export const useWebSocketStore = create<WebSocketStore>((set) => ({
  isConnected: false,
  deliveries: [],
  emergencies: [],
  onlineUsers: [],
  messages: [],
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  addDelivery: (delivery) => set((state) => ({
    deliveries: [delivery, ...state.deliveries.filter(d => d.id !== delivery.id)]
  })),
  
  updateDelivery: (delivery) => set((state) => ({
    deliveries: state.deliveries.map(d => d.id === delivery.id ? delivery : d)
  })),
  
  addEmergency: (alert) => set((state) => ({
    emergencies: [alert, ...state.emergencies.filter(e => e.id !== alert.id)]
  })),
  
  updateEmergency: (alert) => set((state) => ({
    emergencies: state.emergencies.map(e => e.id === alert.id ? alert : e)
  })),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages.slice(-99), message]
  })),
  
  setDeliveries: (deliveries) => set({ deliveries }),
  setEmergencies: (alerts) => set({ emergencies: alerts }),
}));

export function useWebSocket(userId?: string, standId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { 
    isConnected, 
    setConnected, 
    addDelivery, 
    updateDelivery,
    addEmergency,
    updateEmergency,
    setOnlineUsers,
    addMessage
  } = useWebSocketStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnected(true);
        setConnectionError(null);
        
        if (userId) {
          wsRef.current?.send(JSON.stringify({
            type: 'auth',
            userId,
            standId
          }));
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] Attempting reconnect...');
          connect();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionError('Connection error');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('[WebSocket] Auth confirmed:', message.data);
              break;
              
            case 'deliveryUpdate':
              if (message.data) {
                updateDelivery(message.data);
              }
              break;
              
            case 'newDelivery':
              if (message.data) {
                addDelivery(message.data);
              }
              break;
              
            case 'emergency':
              if (message.data) {
                if (message.data.isActive) {
                  addEmergency(message.data);
                } else {
                  updateEmergency(message.data);
                }
              }
              break;
              
            case 'presenceUpdate':
              if (message.data?.onlineUsers) {
                setOnlineUsers(message.data.onlineUsers);
              }
              break;
              
            case 'message':
              addMessage(message.data);
              break;
              
            case 'ping':
              wsRef.current?.send(JSON.stringify({ type: 'pong' }));
              break;
              
            default:
              console.log('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      setConnectionError('Failed to connect');
    }
  }, [userId, standId, setConnected, addDelivery, updateDelivery, addEmergency, updateEmergency, setOnlineUsers, addMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    reconnect: connect
  };
}

export async function fetchDeliveries() {
  const response = await fetch('/api/deliveries');
  if (!response.ok) throw new Error('Failed to fetch deliveries');
  return response.json();
}

export async function createDeliveryRequest(data: {
  requesterId: string;
  standId: string;
  department: string;
  priority: string;
  description: string;
  items?: string;
  quantity?: string;
}) {
  const response = await fetch('/api/deliveries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create delivery request');
  return response.json();
}

export async function updateDeliveryStatus(id: string, status: string, userId: string, eta?: number) {
  const response = await fetch(`/api/deliveries/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, userId, eta })
  });
  if (!response.ok) throw new Error('Failed to update delivery status');
  return response.json();
}

export async function fetchEmergencyAlerts() {
  const response = await fetch('/api/emergency-alerts/active');
  if (!response.ok) throw new Error('Failed to fetch emergency alerts');
  return response.json();
}

export async function createEmergencyAlert(data: {
  reporterId: string;
  alertType: string;
  title: string;
  description: string;
  standId?: string;
}) {
  const response = await fetch('/api/emergency-alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create emergency alert');
  return response.json();
}

export async function acknowledgeEmergencyAlert(id: string, userId: string) {
  const response = await fetch(`/api/emergency-alerts/${id}/acknowledge`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!response.ok) throw new Error('Failed to acknowledge alert');
  return response.json();
}

export async function resolveEmergencyAlert(id: string, userId: string, notes?: string) {
  const response = await fetch(`/api/emergency-alerts/${id}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, notes })
  });
  if (!response.ok) throw new Error('Failed to resolve alert');
  return response.json();
}

export async function fetchOpsDashboard() {
  const response = await fetch('/api/ops/dashboard');
  if (!response.ok) throw new Error('Failed to fetch ops dashboard');
  return response.json();
}

export async function fetchOnlineUsers() {
  const response = await fetch('/api/presence/online');
  if (!response.ok) throw new Error('Failed to fetch online users');
  return response.json();
}

export async function fetchAuditLogs(limit: number = 50) {
  const response = await fetch(`/api/audit-logs?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
}
