import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lookup } from "node:dns/promises";
import net from "node:net";
const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "..", "fixtures");
const FETCH_TIMEOUT_MS = Number(process.env.CRAWL_TIMEOUT_MS ?? 12_000);
/** Hosts that are served from bundled fixtures (used by the demo & tests, and
 *  because the deploy sandbox may have no outbound internet access). */
const FIXTURE_HOSTS = new Set(["example.com", "www.example.com"]);
export class CrawlError extends Error {
}
function isPrivateIp(ip) {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split(".").map(Number);
        if (a === 10)
            return true;
        if (a === 127)
            return true;
        if (a === 0)
            return true;
        if (a === 169 && b === 254)
            return true; // link-local / cloud metadata
        if (a === 172 && b >= 16 && b <= 31)
            return true;
        if (a === 192 && b === 168)
            return true;
        return false;
    }
    const lower = ip.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
}
/** Validate the user-supplied URL and guard against SSRF. */
export async function validateUrl(rawUrl) {
    let url;
    try {
        url = new URL(rawUrl);
    }
    catch {
        throw new CrawlError("Invalid URL.");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new CrawlError("Only http and https URLs are supported.");
    }
    if (FIXTURE_HOSTS.has(url.hostname))
        return url;
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
    }
    catch (err) {
        if (err instanceof CrawlError)
            throw err;
        throw new CrawlError(`Could not resolve host: ${host}`);
    }
    return url;
}
function extractTitle(html) {
    const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return m ? m[1].trim() : "";
}
async function readFixture(url) {
    const segment = url.pathname.split("/").filter(Boolean).pop() ?? "";
    const safe = segment.replace(/[^a-z0-9-]/gi, "");
    try {
        const html = await readFile(join(FIXTURES_DIR, `${safe}.html`), "utf8");
        return { ok: true, html, title: extractTitle(html) };
    }
    catch {
        // Unknown example.com path: return a minimal page (no specs to extract).
        const html = `<!doctype html><html><head><title>${safe || "Product"}</title></head><body><h1>${safe}</h1><p>No specifications published.</p></body></html>`;
        return { ok: true, html, title: safe || "Product" };
    }
}
/** Fetch (or load from fixture) a product page. Enforces a per-request timeout
 *  and never throws for network failures — it returns an error result instead
 *  so a single bad URL cannot crash the session. */
export async function crawl(rawUrl) {
    let url;
    try {
        url = await validateUrl(rawUrl);
    }
    catch (err) {
        return { ok: false, html: "", title: "", error: err.message };
    }
    if (FIXTURE_HOSTS.has(url.hostname)) {
        return readFixture(url);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url.toString(), {
            signal: controller.signal,
            redirect: "follow",
            headers: {
                "User-Agent": "TechAdvisorBot/1.0 (+product-spec-crawler)",
                Accept: "text/html,application/xhtml+xml",
            },
        });
        if (!res.ok) {
            return { ok: false, html: "", title: "", error: `Fetch failed: HTTP ${res.status}` };
        }
        const html = await res.text();
        return { ok: true, html, title: extractTitle(html) };
    }
    catch (err) {
        const msg = err.name === "AbortError" ? "Request timed out." : err.message;
        return { ok: false, html: "", title: "", error: msg };
    }
    finally {
        clearTimeout(timer);
    }
}
