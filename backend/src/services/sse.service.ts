/**
 * SSE (Server-Sent Events) Service
 * Manages client connections and broadcasts real-time events.
 *
 * Events:
 *   - new_rfq    → admin only, when a customer submits RFQ
 *   - pm_overdue → admin only, when PM reminder fires
 *   - rfq_status → customer, when admin updates their RFQ status
 *   - ping       → keepalive every 25s
 */

import { Response } from 'express';
import logger from '../config/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SseEventType =
  | 'new_rfq'
  | 'pm_overdue'
  | 'rfq_status'
  | 'ping'
  | 'connected';

export interface SseEvent<T = unknown> {
  type: SseEventType;
  data: T;
}

interface SseClient {
  userId: string;
  role:   string;
  res:    Response;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const clients = new Map<string, SseClient>(); // key = clientId (userId + random)

// ─── Register / Unregister ────────────────────────────────────────────────────

export function registerClient(userId: string, role: string, res: Response): string {
  const clientId = `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx/Railway disable buffering
  res.flushHeaders();

  clients.set(clientId, { userId, role, res });
  logger.info(`SSE client connected: ${clientId} (role: ${role})`);

  // Send connected event
  sendToClient(res, { type: 'connected', data: { clientId, userId } });

  return clientId;
}

export function unregisterClient(clientId: string): void {
  clients.delete(clientId);
  logger.info(`SSE client disconnected: ${clientId}`);
}

// ─── Send helpers ─────────────────────────────────────────────────────────────

function sendToClient<T>(res: Response, event: SseEvent<T>): void {
  try {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    // Flush immediately (important for Railway's proxy)
    if (typeof (res as any).flush === 'function') (res as any).flush();
  } catch {
    // Client probably disconnected
  }
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

/** Broadcast to all admins */
export function broadcastToAdmins<T>(type: SseEventType, data: T): void {
  let count = 0;
  clients.forEach((client) => {
    if (client.role === 'admin' || client.role === 'superadmin') {
      sendToClient(client.res, { type, data });
      count++;
    }
  });
  if (count > 0) logger.info(`SSE broadcast '${type}' → ${count} admin(s)`);
}

/** Send to a specific user (by userId) */
export function sendToUser<T>(userId: string, type: SseEventType, data: T): void {
  clients.forEach((client) => {
    if (client.userId === userId) {
      sendToClient(client.res, { type, data });
    }
  });
}

// ─── Keepalive ping ───────────────────────────────────────────────────────────

setInterval(() => {
  clients.forEach((client, clientId) => {
    try {
      sendToClient(client.res, { type: 'ping', data: { ts: Date.now() } });
    } catch {
      unregisterClient(clientId);
    }
  });
}, 25_000);

export default { registerClient, unregisterClient, broadcastToAdmins, sendToUser };
