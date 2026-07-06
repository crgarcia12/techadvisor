import { describe, it, expect } from "vitest";
import { extractMetricsFromHtml } from "../src/metrics.js";

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

  it("every extracted value is literally traceable to the HTML", () => {
    const html = `<dl><dt>Panel Type</dt><dd>OLED evo</dd></dl>`;
    const pairs = extractMetricsFromHtml(html);
    for (const p of pairs) {
      expect(html.toLowerCase()).toContain(p.value.toLowerCase());
    }
  });
});
