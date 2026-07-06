import { io, type Socket } from "socket.io-client";

/**
 * BASE is baked in at build time by Vite (`base`). Behind Liliput's proxy it is
 * the stripped prefix, e.g. "/dev/crgarcia12/techadvisor/liliput-task-.../".
 * Locally it is "/". We use it to prefix all API and Socket.IO URLs so the
 * browser hits the proxy at the right path.
 */
export const BASE = import.meta.env.BASE_URL || "/";

const api = (path: string) => `${BASE}${path.replace(/^\//, "")}`;

export interface MetricPair {
  name: string;
  value: string;
  sourceSnippet: string;
  sourceUrl: string;
}

export interface Product {
  id: string;
  url: string;
  price: string;
  title: string;
  status: "researching" | "done" | "error";
  error?: string;
  metrics: Record<string, MetricPair>;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function connectSocket(): Socket {
  return io({ path: `${BASE}socket.io`, transports: ["websocket", "polling"] });
}

export async function sendChat(messages: ChatMessage[]): Promise<{ reply: string; configMissing: boolean }> {
  const res = await fetch(api("api/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`);
  return res.json();
}

export async function addProduct(url: string, price: string): Promise<{ product: Product }> {
  const res = await fetch(api("api/products"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, price }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Add product failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchConfig(): Promise<{ llmConfigured: boolean; llmProvider: string }> {
  const res = await fetch(api("api/config"));
  return res.json();
}
