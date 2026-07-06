export interface MetricPair {
  /** Canonical metric name, e.g. "Resolution". */
  name: string;
  /** Extracted value, e.g. "3840 x 2160". */
  value: string;
  /** Exact text snippet from the crawled page proving the value. Required. */
  sourceSnippet: string;
}

export type MetricStatus = "researching" | "resolved" | "not_found";

export interface Product {
  id: string;
  url: string;
  price: string;
  title: string;
  status: "researching" | "done" | "error";
  error?: string;
  /** Metric name -> pair (only resolved metrics are stored). */
  metrics: Record<string, MetricPair>;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResult {
  reply: string;
  /** True when Azure AI Foundry credentials are absent and a fallback was used. */
  configMissing: boolean;
}
