import { FoundryProvider } from "./foundryProvider.js";
import type { LlmProvider } from "./provider.js";

let cached: LlmProvider | null = null;

/**
 * Returns the active LLM provider. Swap the implementation here to plug in an
 * alternative provider (see provider.ts for the contract).
 */
export function getLlmProvider(): LlmProvider {
  if (!cached) {
    cached = new FoundryProvider();
  }
  return cached;
}

export type { LlmProvider } from "./provider.js";
