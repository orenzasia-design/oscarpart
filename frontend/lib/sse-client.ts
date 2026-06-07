/**
 * SSE Client — frontend/lib/sse-client.ts
 * Wrapper around EventSource dengan:
 *   - Auto-reconnect (exponential backoff, max 30s)
 *   - Auth token injection via URL param (EventSource tidak support custom headers)
 *   - Typed event callbacks
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export type SseEventType = 'new_rfq' | 'pm_overdue' | 'rfq_status' | 'ping' | 'connected';

export interface SseEventData {
  new_rfq: {
    rfq_number:   string;
    company_name: string;
    contact:      string;
    total_items:  number;
    timestamp:    string;
  };
  pm_overdue: {
    unit_name:   string;
    model:       string;
    bundle_name: string;
    hm_overdue:  number;
    user_name:   string;
    timestamp:   string;
  };
  rfq_status: {
    rfq_number: string;
    status:     string;
    timestamp:  string;
  };
  ping: { ts: number };
  connected: { clientId: string; userId: string };
}

type EventCallback<T extends SseEventType> = (data: SseEventData[T]) => void;
type AnyCallback = (type: SseEventType, data: unknown) => void;

interface SseClientOptions {
  onEvent?:       AnyCallback;
  onConnect?:     () => void;
  onDisconnect?:  () => void;
  maxRetryMs?:    number;
}

export class SseClient {
  private es:          EventSource | null = null;
  private retryMs:     number = 1000;
  private maxRetryMs:  number;
  private retryTimer:  ReturnType<typeof setTimeout> | null = null;
  private destroyed:   boolean = false;
  private handlers:    Map<string, EventCallback<SseEventType>[]> = new Map();
  private opts:        SseClientOptions;

  constructor(opts: SseClientOptions = {}) {
    this.opts       = opts;
    this.maxRetryMs = opts.maxRetryMs ?? 30_000;
  }

  connect(token: string): void {
    if (this.destroyed) return;
    this.cleanup();

    // EventSource doesn't support Authorization headers.
    // We append the token as a query param; backend reads it as fallback.
    const url = `${API_URL}/events?token=${encodeURIComponent(token)}`;
    this.es = new EventSource(url);

    const eventTypes: SseEventType[] = ['new_rfq', 'pm_overdue', 'rfq_status', 'ping', 'connected'];

    eventTypes.forEach((type) => {
      this.es!.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          // Call specific handlers
          (this.handlers.get(type) ?? []).forEach((cb) => (cb as any)(data));
          // Call wildcard handler
          this.opts.onEvent?.(type, data);
        } catch {
          // ignore parse errors
        }
      });
    });

    this.es.onopen = () => {
      this.retryMs = 1000; // reset backoff on success
      this.opts.onConnect?.();
    };

    this.es.onerror = () => {
      this.cleanup();
      if (!this.destroyed) {
        this.opts.onDisconnect?.();
        this.scheduleReconnect(token);
      }
    };
  }

  on<T extends SseEventType>(type: T, cb: EventCallback<T>): void {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(cb as EventCallback<SseEventType>);
  }

  off<T extends SseEventType>(type: T, cb: EventCallback<T>): void {
    const arr = this.handlers.get(type) ?? [];
    this.handlers.set(type, arr.filter((h) => h !== (cb as EventCallback<SseEventType>)));
  }

  disconnect(): void {
    this.destroyed = true;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    if (this.es) { this.es.close(); this.es = null; }
  }

  private scheduleReconnect(token: string): void {
    if (this.destroyed) return;
    this.retryTimer = setTimeout(() => {
      this.retryMs = Math.min(this.retryMs * 2, this.maxRetryMs);
      this.connect(token);
    }, this.retryMs);
  }
}

// Singleton untuk admin shell
let sharedClient: SseClient | null = null;

export function getSseClient(): SseClient {
  if (!sharedClient) sharedClient = new SseClient();
  return sharedClient;
}

export function destroySseClient(): void {
  sharedClient?.disconnect();
  sharedClient = null;
}
