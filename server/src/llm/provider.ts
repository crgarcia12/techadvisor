import type { ChatMessage, MetricPair } from "../types.js";

/**
 * Pluggable LLM provider abstraction.
 *
 * The application only ever uses an LLM for TWO things:
 *   1. `chat()`   — drive the clarifying conversation that narrows the product.
 *   2. `extractMetrics()` — normalise RAW CRAWLED TEXT into structured
 *      name/value pairs. It must NEVER invent values; every returned pair must
 *      carry a `sourceSnippet` copied verbatim from the supplied raw text.
 *
 * To plug in a different provider (OpenAI, Anthropic, a local model, ...),
 * implement this interface in a single new file and return it from
 * `getLlmProvider()` below. Nothing else in the codebase needs to change.
 */
export interface LlmProvider {
  /** Human-readable id, surfaced in logs/health. */
  readonly name: string;
  /** Whether the provider has the credentials/config it needs to run. */
  isConfigured(): boolean;
  /** Produce the assistant's next clarifying reply. */
  chat(messages: ChatMessage[]): Promise<string>;
  /**
   * Optionally refine already-parsed metric candidates. Implementations MUST
   * only return pairs whose value is present in `rawText` (traceable), and
   * MUST NOT add metrics that are not supported by `rawText`.
   */
  extractMetrics(rawText: string, candidates: MetricPair[]): Promise<MetricPair[]>;
}
