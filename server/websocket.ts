import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { log } from './index';

interface WebSocketClient extends WebSocket {
  userId?: string;
  userRole?: string;
  standId?: string;
  isAlive?: boolean;
}

interface BroadcastMessage {
  type: string;
  payload: any;
  targetRoles?: string[];
  targetUserIds?: string[];
  excludeUserId?: string;
}

class OrbyWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupEventHandlers();
    this.startHeartbeat();
    log('WebSocket server initialized', 'websocket');
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocketClient, req) => {
      log(`New WebSocket connection from ${req.socket.remoteAddress}`, 'websocket');
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          log(`Invalid WebSocket message: ${error}`, 'websocket');
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
          this.broadcastPresenceUpdate();
          log(`User ${ws.userId} disconnected`, 'websocket');
        }
      });

      ws.on('error', (error) => {
        log(`WebSocket error: ${error}`, 'websocket');
      });
    });
  }

  private handleMessage(ws: WebSocketClient, message: any) {
    switch (message.type) {
      case 'auth':
        this.handleAuth(ws, message.payload);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      case 'presence_update':
        this.handlePresenceUpdate(ws, message.payload);
        break;
      case 'typing':
        this.handleTyping(ws, message.payload);
        break;
      default:
        log(`Unknown message type: ${message.type}`, 'websocket');
    }
  }

  private handleAuth(ws: WebSocketClient, payload: { userId: string; role: string; standId?: string }) {
    ws.userId = payload.userId;
    ws.userRole = payload.role;
    ws.standId = payload.standId;
    this.clients.set(payload.userId, ws);
    
    ws.send(JSON.stringify({ 
      type: 'auth_success', 
      payload: { connected: true, onlineUsers: this.getOnlineUsers() }
    }));
    
    this.broadcastPresenceUpdate();
    log(`User ${payload.userId} authenticated as ${payload.role}`, 'websocket');
  }

  private handlePresenceUpdate(ws: WebSocketClient, payload: { standId?: string }) {
    if (ws.userId) {
      ws.standId = payload.standId;
      this.broadcastPresenceUpdate();
    }
  }

  private handleTyping(ws: WebSocketClient, payload: { conversationId: string }) {
    if (!ws.userId) return;
    
    this.broadcast({
      type: 'user_typing',
      payload: {
        userId: ws.userId,
        conversationId: payload.conversationId
      },
      excludeUserId: ws.userId
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (ws.isAlive === false) {
          if (ws.userId) {
            this.clients.delete(ws.userId);
          }
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  getOnlineUsers(): Array<{ userId: string; role: string; standId?: string }> {
    const users: Array<{ userId: string; role: string; standId?: string }> = [];
    this.clients.forEach((client) => {
      if (client.userId && client.userRole) {
        users.push({
          userId: client.userId,
          role: client.userRole,
          standId: client.standId
        });
      }
    });
    return users;
  }

  private broadcastPresenceUpdate() {
    this.broadcast({
      type: 'presence_update',
      payload: { onlineUsers: this.getOnlineUsers() }
    });
  }

  broadcast(message: BroadcastMessage) {
    const data = JSON.stringify({ type: message.type, payload: message.payload });
    
    this.clients.forEach((client, clientUserId) => {
      if (client.readyState !== WebSocket.OPEN) return;
      if (message.excludeUserId && clientUserId === message.excludeUserId) return;
      
      if (message.targetUserIds && !message.targetUserIds.includes(clientUserId)) return;
      if (message.targetRoles && client.userRole && !message.targetRoles.includes(client.userRole)) return;
      
      try {
        client.send(data);
      } catch (error) {
        log(`Failed to send to ${clientUserId}: ${error}`, 'websocket');
      }
    });
  }

  sendToUser(userId: string, type: string, payload: any) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, payload }));
    }
  }

  sendToRole(role: string, type: string, payload: any) {
    this.broadcast({ type, payload, targetRoles: [role] });
  }

  sendToRoles(roles: string[], type: string, payload: any) {
    this.broadcast({ type, payload, targetRoles: roles });
  }

  broadcastDeliveryUpdate(delivery: any) {
    this.broadcast({
      type: 'delivery_update',
      payload: delivery,
      targetRoles: ['ManagementCore', 'ManagementAssistant', 'StandSupervisor', 'Admin', 'Developer']
    });
  }

  broadcastIssueUpdate(issue: any) {
    this.broadcast({
      type: 'issue_update',
      payload: issue,
      targetRoles: ['ManagementCore', 'ManagementAssistant', 'StandSupervisor', 'IT', 'Admin', 'Developer']
    });
  }

  broadcastNewMessage(conversationId: string, message: any, participants: string[]) {
    this.broadcast({
      type: 'new_message',
      payload: { conversationId, message },
      targetUserIds: participants
    });
  }

  broadcastEmergency(alert: any) {
    this.broadcast({
      type: 'emergency_alert',
      payload: alert
    });
  }

  broadcastAuditEvent(event: any) {
    this.broadcast({
      type: 'audit_event',
      payload: event,
      targetRoles: ['ManagementCore', 'Admin', 'Developer']
    });
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }
}

let wsServer: OrbyWebSocketServer | null = null;

export function initializeWebSocket(server: Server): OrbyWebSocketServer {
  if (!wsServer) {
    wsServer = new OrbyWebSocketServer(server);
  }
  return wsServer;
}

export function getWebSocketServer(): OrbyWebSocketServer | null {
  return wsServer;
}

export { OrbyWebSocketServer };
