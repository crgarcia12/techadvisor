import { describe, it, expect, vi, afterEach } from "vitest";
import { browserHeaders, crawl } from "../src/crawl/crawler.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("browserHeaders", () => {
  it("presents a realistic desktop browser User-Agent (not a bot)", () => {
    const h = browserHeaders();
    expect(h["User-Agent"]).toMatch(/Mozilla\/5\.0/);
    expect(h["User-Agent"]).not.toMatch(/bot/i);
    expect(h["Accept-Language"]).toBeTruthy();
  });

  it("includes a Referer when provided", () => {
    const h = browserHeaders("https://www.mediamarkt.ch/");
    expect(h.Referer).toBe("https://www.mediamarkt.ch/");
  });
});

describe("crawl", () => {
  it("sends browser-like headers and a same-origin referer", async () => {
    const seen: Record<string, string> = {};
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      Object.assign(seen, init.headers as Record<string, string>);
      return new Response("<html><head><title>OK</title></head><body></body></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await crawl("https://www.mediamarkt.ch/de/product/x-2278338.html");
    expect(res.ok).toBe(true);
    expect(seen["User-Agent"]).toMatch(/Mozilla\/5\.0/);
    expect(seen.Referer).toBe("https://www.mediamarkt.ch/");
  });

  it("retries once on a 403 and succeeds on the second attempt", async () => {
    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return new Response("blocked", { status: 403 });
      return new Response("<html><head><title>Samsung</title></head></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await crawl("https://www.mediamarkt.ch/de/product/x-2278338.html");
    expect(calls).toBe(2);
    expect(res.ok).toBe(true);
    expect(res.title).toBe("Samsung");
  });

  it("surfaces a clear, non-crashing error when a 403 persists", async () => {
    const fetchMock = vi.fn(async () => new Response("blocked", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await crawl("https://www.mediamarkt.ch/de/product/x-2278338.html");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("403");
    expect(res.error).toMatch(/blocked automated access/);
    // Retried the full number of attempts before giving up.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
