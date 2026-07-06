import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lookup } from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "..", "fixtures");

const FETCH_TIMEOUT_MS = Number(process.env.CRAWL_TIMEOUT_MS ?? 12_000);

/** Browser-like request headers. Many retailers (e.g. MediaMarkt) reject
 *  requests whose User-Agent advertises a bot with a 403, so we present a
 *  realistic desktop-browser fingerprint. This is standard, publicly-served
 *  product-page HTML — we honour redirects and per-request timeouts and never
 *  attempt to defeat JavaScript challenges. */
export function browserHeaders(referer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
  };
  if (referer) headers.Referer = referer;
  return headers;
}

/** Hosts that are served from bundled fixtures (used by the demo & tests, and
 *  because the deploy sandbox may have no outbound internet access). */
const FIXTURE_HOSTS = new Set(["example.com", "www.example.com"]);

export interface CrawlResult {
  ok: boolean;
  html: string;
  title: string;
  error?: string;
}

export class CrawlError extends Error {}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
}

/** Validate the user-supplied URL and guard against SSRF. */
export async function validateUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new CrawlError("Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CrawlError("Only http and https URLs are supported.");
  }
  if (FIXTURE_HOSTS.has(url.hostname)) return url;

  // Block obvious internal targets before any DNS resolution.
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new CrawlError("Refusing to crawl internal host.");
  }
  if (net.isIP(host) && isPrivateIp(host)) {
    throw new CrawlError("Refusing to crawl private address.");
  }
  // Resolve and re-check to prevent DNS-rebinding to private ranges.
  try {
    const { address } = await lookup(host);
    if (isPrivateIp(address)) {
      throw new CrawlError("Refusing to crawl host that resolves to a private address.");
    }
  } catch (err) {
    if (err instanceof CrawlError) throw err;
    throw new CrawlError(`Could not resolve host: ${host}`);
  }
  return url;
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "";
}

/**
 * Discover the official product page from a stored (retailer) page's HTML.
 *
 * We only trust links already present in the crawled page — never external
 * knowledge — so discovery is deterministic and traceable. Candidates, in
 * priority order:
 *   1. `<link rel="canonical">` pointing to a different host
 *   2. Open Graph `og:url` pointing to a different host
 *   3. anchors flagged as the manufacturer / official site
 *
 * Returns an absolute URL string, or null when nothing suitable is found. The
 * returned URL is NOT yet SSRF-validated — the caller must run it through
 * `crawl()` (which calls `validateUrl`) before fetching.
 */
export function discoverOfficialUrl(html: string, storedUrl: string): string | null {
  let base: URL;
  try {
    base = new URL(storedUrl);
  } catch {
    return null;
  }
  const $ = cheerio.load(html);

  const resolve = (href: string | undefined): URL | null => {
    if (!href) return null;
    try {
      return new URL(href, base);
    } catch {
      return null;
    }
  };

  const differentPage = (u: URL | null): boolean =>
    !!u &&
    (u.protocol === "http:" || u.protocol === "https:") &&
    u.toString().replace(/#.*$/, "") !== base.toString().replace(/#.*$/, "");

  // 1. Canonical link on a different host.
  const canonical = resolve($('link[rel="canonical"]').attr("href"));
  if (differentPage(canonical) && canonical!.hostname !== base.hostname) {
    return canonical!.toString();
  }

  // 2. Open Graph url on a different host.
  const ogUrl = resolve($('meta[property="og:url"]').attr("content"));
  if (differentPage(ogUrl) && ogUrl!.hostname !== base.hostname) {
    return ogUrl!.toString();
  }

  // 3. Explicitly flagged official / manufacturer links.
  let officialHref: string | null = null;
  $("a[href]").each((_, el) => {
    if (officialHref) return;
    const $el = $(el);
    const rel = ($el.attr("rel") ?? "").toLowerCase();
    const text = ($el.text() ?? "").toLowerCase();
    const flagged =
      rel.includes("manufacturer") ||
      /official (product )?(page|site|website)/.test(text) ||
      /manufacturer('s)? (page|site|website)/.test(text);
    if (!flagged) return;
    const u = resolve($el.attr("href"));
    if (differentPage(u)) officialHref = u!.toString();
  });
  return officialHref;
}

async function readFixture(url: URL): Promise<CrawlResult> {
  const segment = url.pathname.split("/").filter(Boolean).pop() ?? "";
  const safe = segment.replace(/[^a-z0-9-]/gi, "");
  try {
    const html = await readFile(join(FIXTURES_DIR, `${safe}.html`), "utf8");
    return { ok: true, html, title: extractTitle(html) };
  } catch {
    // Unknown example.com path: return a minimal page (no specs to extract).
    const html = `<!doctype html><html><head><title>${safe || "Product"}</title></head><body><h1>${safe}</h1><p>No specifications published.</p></body></html>`;
    return { ok: true, html, title: safe || "Product" };
  }
}

/** Fetch (or load from fixture) a product page. Enforces a per-request timeout
 *  and never throws for network failures — it returns an error result instead
 *  so a single bad URL cannot crash the session. */
export async function crawl(rawUrl: string): Promise<CrawlResult> {
  let url: URL;
  try {
    url = await validateUrl(rawUrl);
  } catch (err) {
    return { ok: false, html: "", title: "", error: (err as Error).message };
  }

  if (FIXTURE_HOSTS.has(url.hostname)) {
    return readFixture(url);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // Use the page's own origin as Referer — retailers frequently 403 requests
    // that arrive with no referer. One transparent retry (with a short backoff)
    // absorbs the occasional first-hit block some bot filters apply.
    const referer = `${url.protocol}//${url.host}/`;
    const attempts = 2;
    let lastStatus = 0;
    for (let i = 0; i < attempts; i++) {
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: browserHeaders(referer),
      });
      if (res.ok) {
        const html = await res.text();
        return { ok: true, html, title: extractTitle(html) };
      }
      lastStatus = res.status;
      // Only a transient block/rate-limit is worth retrying.
      const retriable = res.status === 403 || res.status === 429 || res.status >= 500;
      if (!retriable || i === attempts - 1) {
        const hint =
          res.status === 403
            ? " (the site blocked automated access)"
            : res.status === 429
              ? " (rate limited)"
              : "";
        return { ok: false, html: "", title: "", error: `Fetch failed: HTTP ${res.status}${hint}` };
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return { ok: false, html: "", title: "", error: `Fetch failed: HTTP ${lastStatus}` };
  } catch (err) {
    const msg = (err as Error).name === "AbortError" ? "Request timed out." : (err as Error).message;
    return { ok: false, html: "", title: "", error: msg };
  } finally {
    clearTimeout(timer);
  }
}
