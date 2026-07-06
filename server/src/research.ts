import type { Server } from "socket.io";
import { crawl, discoverOfficialUrl } from "./crawl/crawler.js";
import { extractMetricsFromHtml, mergeMetricSources } from "./metrics.js";
import { getLlmProvider } from "./llm/index.js";
import type { MetricPair, Product } from "./types.js";

/** In-memory comparison store (single shared comparison; see Out of Scope). */
export const products = new Map<string, Product>();

/** Small, configurable pacing so the live "researching" indicator is visible and
 *  the table visibly fills in real time. Set to 0 to disable in tests. */
const INITIAL_DELAY_MS = Number(process.env.RESEARCH_INITIAL_DELAY_MS ?? 700);
const METRIC_STAGGER_MS = Number(process.env.RESEARCH_METRIC_STAGGER_MS ?? 220);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
 * Extract source-attributed metrics from an already-crawled page's HTML. Runs
 * the deterministic HTML extractor (tagging every pair with `sourceUrl`) and,
 * when an LLM is configured, an optional normalisation pass that only reshapes
 * values already present in the page.
 */
async function extractFromHtml(html: string, sourceUrl: string): Promise<MetricPair[]> {
  let pairs = extractMetricsFromHtml(html, sourceUrl);

  const provider = getLlmProvider();
  if (provider.isConfigured() && pairs.length > 0) {
    try {
      pairs = await provider.extractMetrics(html.replace(/<[^>]+>/g, " "), pairs);
    } catch {
      /* keep deterministic pairs */
    }
  }
  return pairs;
}

/**
 * Crawl the product page, extract real metrics from the crawled HTML only, then
 * stream results over Socket.IO. Never fabricates values.
 *
 * Two sources are consulted per product: the user-provided stored URL, plus an
 * auto-discovered official product page (derived from links in the stored page)
 * which typically publishes many more specs. Each extracted spec keeps a
 * `sourceUrl` pointing at the exact page it came from. When official-page
 * discovery finds nothing — or the official page fails to crawl — the stored
 * page's metrics are used on their own (graceful degradation).
 */
export async function researchProduct(io: Server, product: Product): Promise<void> {
  io.emit("product:added", { product, researchingKeys: RESEARCH_KEYS });

  await sleep(INITIAL_DELAY_MS);

  const storedResult = await crawl(product.url);
  if (!storedResult.ok) {
    product.status = "error";
    product.error = storedResult.error;
    products.set(product.id, product);
    io.emit("product:error", { id: product.id, error: storedResult.error, researchingKeys: RESEARCH_KEYS });
    return;
  }

  if (storedResult.title) {
    product.title = storedResult.title;
    io.emit("product:title", { id: product.id, title: storedResult.title });
  }

  // Source 1: the user-provided stored page.
  const storedPairs = await extractFromHtml(storedResult.html, product.url);

  // Source 2: the auto-discovered official product page (extra specs).
  let officialPairs: MetricPair[] = [];
  const officialUrl = discoverOfficialUrl(storedResult.html, product.url);
  if (officialUrl) {
    const official = await crawl(officialUrl);
    if (official.ok) {
      officialPairs = await extractFromHtml(official.html, officialUrl);
    }
  }

  // Stored (user-provided) source wins per metric; the official page fills in
  // the specs the stored page did not list.
  let pairs = mergeMetricSources([storedPairs, officialPairs]);

  // Guard: discard anything lacking a traceable source snippet or url.
  pairs = pairs.filter((p) => p && p.name && p.value && p.sourceSnippet && p.sourceUrl);

  const resolvedNames = new Set<string>();
  for (const pair of pairs) {
    product.metrics[pair.name] = pair;
    resolvedNames.add(pair.name);
    io.emit("metric:update", { id: product.id, metric: pair, status: "resolved" });
    await sleep(METRIC_STAGGER_MS);
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
