import type { Server } from "socket.io";
import { crawl } from "./crawl/crawler.js";
import { extractMetricsFromHtml } from "./metrics.js";
import { getLlmProvider } from "./llm/index.js";
import type { Product } from "./types.js";

/** In-memory comparison store (single shared comparison; see Out of Scope). */
export const products = new Map<string, Product>();

/** Metric keys we optimistically show as "researching" until resolved/omitted. */
const RESEARCH_KEYS = [
  "Screen Size",
  "Resolution",
  "Panel Type",
  "Refresh Rate",
  "Contrast Ratio",
  "HDR",
];

export function createProduct(url: string, price: string): Product {
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const product: Product = {
    id,
    url,
    price,
    title: url,
    status: "researching",
    metrics: {},
  };
  products.set(id, product);
  return product;
}

/**
 * Crawl the product page, extract real metrics from the crawled HTML only, then
 * stream results over Socket.IO. Never fabricates values.
 */
export async function researchProduct(io: Server, product: Product): Promise<void> {
  io.emit("product:added", { product, researchingKeys: RESEARCH_KEYS });

  const result = await crawl(product.url);
  if (!result.ok) {
    product.status = "error";
    product.error = result.error;
    products.set(product.id, product);
    io.emit("product:error", { id: product.id, error: result.error, researchingKeys: RESEARCH_KEYS });
    return;
  }

  if (result.title) {
    product.title = result.title;
    io.emit("product:title", { id: product.id, title: result.title });
  }

  // Deterministic extraction from crawled HTML — the source of truth.
  let pairs = extractMetricsFromHtml(result.html);

  // Optional LLM normalisation (only reshapes values already in the page).
  const provider = getLlmProvider();
  if (provider.isConfigured() && pairs.length > 0) {
    try {
      pairs = await provider.extractMetrics(result.html.replace(/<[^>]+>/g, " "), pairs);
    } catch {
      /* keep deterministic pairs */
    }
  }

  // Guard: discard anything lacking a traceable source snippet.
  pairs = pairs.filter((p) => p && p.name && p.value && p.sourceSnippet);

  const resolvedNames = new Set<string>();
  for (const pair of pairs) {
    product.metrics[pair.name] = pair;
    resolvedNames.add(pair.name);
    io.emit("metric:update", { id: product.id, metric: pair, status: "resolved" });
  }

  // Mark the optimistic research keys that were NOT found as not_found so the UI
  // can stop the spinner for them (they will simply be omitted).
  for (const key of RESEARCH_KEYS) {
    if (!resolvedNames.has(key)) {
      io.emit("metric:update", { id: product.id, metric: { name: key }, status: "not_found" });
    }
  }

  product.status = "done";
  products.set(product.id, product);
  io.emit("product:done", { id: product.id, product });
}
