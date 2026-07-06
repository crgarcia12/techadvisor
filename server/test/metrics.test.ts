import { describe, it, expect } from "vitest";
import { extractMetricsFromHtml, mergeMetricSources } from "../src/metrics.js";

describe("extractMetricsFromHtml", () => {
  it("extracts metrics from a spec table with traceable source snippets", () => {
    const html = `
      <table>
        <tr><th>Resolution</th><td>3840 x 2160</td></tr>
        <tr><th>Refresh Rate</th><td>120 Hz</td></tr>
      </table>`;
    const pairs = extractMetricsFromHtml(html);
    const byName = Object.fromEntries(pairs.map((p) => [p.name, p]));
    expect(byName["Resolution"].value).toBe("3840 x 2160");
    // Every returned pair must carry a source snippet (no fabrication).
    for (const p of pairs) {
      expect(p.sourceSnippet).toBeTruthy();
      expect(html).toContain(p.value);
    }
  });

  it("extracts metrics from JSON-LD additionalProperty", () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","additionalProperty":[
        {"name":"Contrast Ratio","value":"5000:1"}]}</script>`;
    const pairs = extractMetricsFromHtml(html);
    expect(pairs.find((p) => p.name === "Contrast Ratio")?.value).toBe("5000:1");
  });

  it("omits metrics that are not present on the page (no fabrication)", () => {
    const html = `<table><tr><th>Resolution</th><td>4K UHD</td></tr></table>`;
    const pairs = extractMetricsFromHtml(html);
    // Contrast Ratio was never on the page → must not appear.
    expect(pairs.find((p) => p.name === "Contrast Ratio")).toBeUndefined();
  });

  it("tags every extracted pair with the source URL it came from", () => {
    const url = "https://shop.example.com/tv/xyz";
    const html = `<table><tr><th>Resolution</th><td>4K UHD</td></tr></table>`;
    const pairs = extractMetricsFromHtml(html, url);
    expect(pairs.length).toBeGreaterThan(0);
    for (const p of pairs) {
      expect(p.sourceUrl).toBe(url);
    }
  });
});

describe("mergeMetricSources", () => {
  const stored = "https://shop.example.com/tv/xyz";
  const official = "https://official.example.com/tv/xyz";

  it("keeps the stored source for shared metrics and adds official-only specs", () => {
    const storedPairs = [
      { name: "Resolution", value: "4K UHD", sourceSnippet: "Resolution: 4K UHD", sourceUrl: stored },
    ];
    const officialPairs = [
      { name: "Resolution", value: "3840 x 2160", sourceSnippet: "Resolution: 3840 x 2160", sourceUrl: official },
      { name: "Brightness", value: "1500 nits", sourceSnippet: "Brightness: 1500 nits", sourceUrl: official },
    ];
    const merged = mergeMetricSources([storedPairs, officialPairs]);
    const byName = Object.fromEntries(merged.map((p) => [p.name, p]));
    // Stored (first) source wins for the shared metric.
    expect(byName["Resolution"].value).toBe("4K UHD");
    expect(byName["Resolution"].sourceUrl).toBe(stored);
    // Official page contributes the extra spec, attributed to its own URL.
    expect(byName["Brightness"].value).toBe("1500 nits");
    expect(byName["Brightness"].sourceUrl).toBe(official);
  });

  it("drops entries that lack a traceable source url", () => {
    const merged = mergeMetricSources([
      [{ name: "HDR", value: "HDR10+", sourceSnippet: "HDR: HDR10+", sourceUrl: "" }],
    ]);
    expect(merged.find((p) => p.name === "HDR")).toBeUndefined();
  });
});
