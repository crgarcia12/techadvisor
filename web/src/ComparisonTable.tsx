import type { Product } from "./api.js";

interface Props {
  products: Product[];
  researching: Record<string, Set<string>>;
}

const PREFERRED_ORDER = [
  "Screen Size",
  "Resolution",
  "Panel Type",
  "Refresh Rate",
  "Contrast Ratio",
  "HDR",
  "Brightness",
  "Smart Platform",
  "HDMI Ports",
  "USB Ports",
  "Connectivity",
  "Audio Output",
  "Energy Class",
  "Weight",
];

function Glasses({ label }: { label?: string }) {
  return (
    <span className="glasses" data-testid="glasses" title="Researching…" aria-label="Researching">
      <span className="glasses__icon" role="img" aria-hidden="true">
        🔎
      </span>
      {label && <span className="glasses__label">{label}</span>}
    </span>
  );
}

export function ComparisonTable({ products, researching }: Props) {
  // A metric row is shown if at least one product has a real value for it OR is
  // actively researching it. Metrics never found for any product are omitted.
  const metricNames = new Set<string>();
  for (const p of products) {
    for (const name of Object.keys(p.metrics)) metricNames.add(name);
    for (const name of researching[p.id] ?? []) metricNames.add(name);
  }
  const rows = [...metricNames].sort((a, b) => {
    const ia = PREFERRED_ORDER.indexOf(a);
    const ib = PREFERRED_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <div className="table-wrap">
      <h2 className="pane__title">Comparison</h2>
      {products.length === 0 ? (
        <p className="table-empty" data-testid="table-empty">
          No products yet. Paste a product URL and price on the left to start comparing real specs.
        </p>
      ) : (
        <table className="ctable" data-testid="comparison-table">
          <thead>
            <tr>
              <th className="ctable__metric-head">Metric</th>
              {products.map((p) => {
                const busy = (researching[p.id]?.size ?? 0) > 0;
                return (
                  <th key={p.id} data-testid={`product-col-${p.id}`} className="ctable__product-head">
                    <div className="product-title">{p.title || p.url}</div>
                    <a className="product-url" href={p.url} target="_blank" rel="noreferrer">
                      {p.url}
                    </a>
                    {busy && (
                      <div data-testid={`researching-${p.id}`} className="product-researching">
                        <Glasses label="Researching…" />
                      </div>
                    )}
                    {p.status === "error" && (
                      <div className="product-error" data-testid={`error-${p.id}`}>
                        ⚠️ {p.error || "Could not fetch this page."}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="ctable__row ctable__row--price" data-testid="row-Price">
              <th scope="row">Price</th>
              {products.map((p) => (
                <td key={p.id} data-testid={`price-${p.id}`} className="ctable__price">
                  {p.price ? p.price : "—"}
                </td>
              ))}
            </tr>
            {rows.map((name) => (
              <tr key={name} className="ctable__row" data-testid={`row-${name}`}>
                <th scope="row">{name}</th>
                {products.map((p) => {
                  const metric = p.metrics[name];
                  const busy = researching[p.id]?.has(name);
                  return (
                    <td key={p.id} data-testid={`cell-${p.id}-${name}`} className="ctable__cell">
                      {metric ? (
                        metric.sourceUrl ? (
                          <a
                            className="metric-value metric-value--link"
                            href={metric.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={`${metric.sourceSnippet}\nSource: ${metric.sourceUrl}`}
                            data-testid={`source-${p.id}-${name}`}
                          >
                            {metric.value}
                            <span className="metric-source" aria-hidden="true">
                              ↗
                            </span>
                          </a>
                        ) : (
                          <span className="metric-value" title={metric.sourceSnippet}>
                            {metric.value}
                          </span>
                        )
                      ) : busy ? (
                        <Glasses />
                      ) : (
                        <span className="metric-missing" aria-hidden="true">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
