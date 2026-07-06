import * as cheerio from "cheerio";
import type { MetricPair } from "./types.js";

/**
 * Canonical metric names we recognise, each with the label patterns that map to
 * it. Only metrics that match one of these patterns are surfaced, keeping the
 * comparison table focused on real, relevant product characteristics.
 */
const CANONICAL: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "Screen Size", patterns: [/screen size/i, /\bdisplay size\b/i, /diagonal/i, /\bsize\b.*inch/i] },
  { name: "Resolution", patterns: [/resolution/i, /\b(4k|8k|uhd|fhd|full hd)\b/i] },
  { name: "Panel Type", patterns: [/panel type/i, /panel technology/i, /\bdisplay type\b/i, /\bpanel\b/i] },
  { name: "Refresh Rate", patterns: [/refresh rate/i, /\bhz\b/i, /motion rate/i] },
  { name: "Contrast Ratio", patterns: [/contrast ratio/i, /\bcontrast\b/i] },
  { name: "HDR", patterns: [/\bhdr\b/i, /high dynamic range/i, /dolby vision/i] },
  { name: "Brightness", patterns: [/brightness/i, /\bnits\b/i, /peak luminance/i] },
  { name: "Smart Platform", patterns: [/smart (tv )?platform/i, /operating system/i, /\bos\b/i, /webos/i, /tizen/i, /google tv/i] },
  { name: "HDMI Ports", patterns: [/hdmi ports?/i, /number of hdmi/i, /hdmi inputs?/i] },
  { name: "USB Ports", patterns: [/usb ports?/i, /number of usb/i] },
  { name: "Connectivity", patterns: [/connectivity/i, /wireless/i, /\bwi-?fi\b/i, /bluetooth/i] },
  { name: "Audio Output", patterns: [/audio output/i, /speaker power/i, /sound output/i] },
  { name: "Weight", patterns: [/\bweight\b/i] },
  { name: "Energy Class", patterns: [/energy (class|rating|efficiency)/i] },
];

function canonicalName(rawLabel: string): string | null {
  const label = rawLabel.trim();
  if (!label) return null;
  for (const entry of CANONICAL) {
    if (entry.patterns.some((re) => re.test(label))) {
      return entry.name;
    }
  }
  return null;
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function snippet(label: string, value: string): string {
  return clean(`${label}: ${value}`).slice(0, 200);
}

/**
 * Extract structured metric pairs from raw product-page HTML using ONLY the
 * page content — no external knowledge. Sources considered:
 *   1. JSON-LD Product `additionalProperty`
 *   2. Definition lists (dt/dd)
 *   3. Two-column spec tables (th/td or td/td)
 *   4. "Label: value" list items
 *
 * Every returned pair carries a `sourceSnippet` copied from the page, so callers
 * can discard anything not traceable to crawled content.
 */
export function extractMetricsFromHtml(html: string, sourceUrl = ""): MetricPair[] {
  const $ = cheerio.load(html);
  const found = new Map<string, MetricPair>();

  const add = (rawLabel: string, rawValue: string) => {
    const label = clean(rawLabel);
    const value = clean(rawValue);
    if (!label || !value || value.length > 120) return;
    const name = canonicalName(label);
    if (!name) return;
    if (found.has(name)) return; // first traceable value wins
    found.set(name, { name, value, sourceSnippet: snippet(label, value), sourceUrl });
  };

  // 1. JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    try {
      const parseNode = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        const obj = node as Record<string, unknown>;
        const props = obj.additionalProperty;
        if (Array.isArray(props)) {
          for (const p of props) {
            const pp = p as Record<string, unknown>;
            if (pp && pp.name && pp.value !== undefined) {
              add(String(pp.name), String(pp.value));
            }
          }
        }
      };
      const data = JSON.parse(raw);
      if (Array.isArray(data)) data.forEach(parseNode);
      else parseNode(data);
    } catch {
      /* ignore malformed JSON-LD */
    }
  });

  // 2. Definition lists
  $("dl").each((_, dl) => {
    const dts = $(dl).find("dt");
    dts.each((i, dt) => {
      const dd = $(dt).next("dd");
      if (dd.length) add($(dt).text(), dd.text());
    });
  });

  // 3. Spec tables
  $("table tr").each((_, tr) => {
    const cells = $(tr).children("th,td");
    if (cells.length >= 2) {
      add($(cells[0]).text(), $(cells[1]).text());
    }
  });

  // 4. "Label: value" list items / spec rows
  $("li, .spec, .specification, [class*='spec']").each((_, el) => {
    const text = clean($(el).text());
    const m = text.match(/^([^:]{2,40}):\s*(.+)$/);
    if (m) add(m[1], m[2]);
  });

  return [...found.values()];
}

/**
 * Merge metric pairs extracted from multiple sources (the user-provided stored
 * page and the auto-discovered official product page) into a single set.
 *
 * Sources are considered in order — earlier sources win for a given metric, so
 * pass the higher-trust source first. Metrics found ONLY in a later source are
 * added, which is how the official page contributes the extra specs the stored
 * page omits. Every returned pair keeps the `sourceUrl` of the page it came
 * from, so the UI can link each spec value back to its origin. Entries lacking
 * a traceable source (no snippet or no url) are dropped.
 */
export function mergeMetricSources(sources: MetricPair[][]): MetricPair[] {
  const merged = new Map<string, MetricPair>();
  for (const pairs of sources) {
    for (const p of pairs) {
      if (!p || !p.name || !p.value || !p.sourceSnippet || !p.sourceUrl) continue;
      if (merged.has(p.name)) continue; // earlier source wins
      merged.set(p.name, p);
    }
  }
  return [...merged.values()];
}
