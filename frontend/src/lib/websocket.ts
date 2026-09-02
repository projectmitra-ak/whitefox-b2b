import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

type EventCallback = (data: unknown) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Max reconnection attempts reached'));
        }
      });

      this.socket.on('*', (event, data) => {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
          listeners.forEach(callback => callback(data));
        }
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  unsubscribe(event: string, callback: EventCallback) {
    this.eventListeners.get(event)?.delete(callback);
  }

  emit(event: string, data: unknown) {
    this.socket?.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const ws = new WebSocketClient();

// Event types
export const WS_EVENTS = {
  GARMENT_STATUS_CHANGED: 'garment:status_changed',
  GARMENT_LOCATION_UPDATED: 'garment:location_updated',
  PICKUP_COMPLETED: 'pickup:completed',
  PICKUP_SCANNED: 'pickup:scanned',
  WASH_BATCH_STARTED: 'wash_batch:started',
  WASH_BATCH_COMPLETED: 'wash_batch:completed',
  QUALITY_CHECK_COMPLETED: 'quality_check:completed',
  DISPATCH_COMPLETED: 'dispatch:completed',
  DELIVERY_CONFIRMED: 'delivery:confirmed',
  DELIVERY_SCANNED: 'delivery:scanned',
  RECONCILIATION_COMPLETED: 'reconciliation:completed',
  DISCREPANCY_DETECTED: 'discrepancy:detected',
  MISSING_GARMENT_ALERT: 'missing_garment:alert',
  SLA_RISK_ALERT: 'sla_risk:alert',
  INVENTORY_UPDATED: 'inventory:updated',
  RFID_EVENT: 'rfid:event',
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];