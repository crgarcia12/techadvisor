import React, { useMemo } from 'react';
import type { ComparisonData, MetricValue } from './types';
import './ComparisonTable.css';

interface ComparisonTableProps {
  data: ComparisonData;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  const { products, metrics, values } = data;

  // Build a lookup map for metric values
  const valueMap = useMemo(() => {
    const map = new Map<string, MetricValue>();
    values.forEach(v => {
      const key = `${v.productId}-${v.metricId}`;
      map.set(key, v);
    });
    return map;
  }, [values]);

  // Filter metrics: only show metrics that have at least one non-notFound value
  const visibleMetrics = useMemo(() => {
    return metrics.filter(metric => {
      // Check if at least one product has a value for this metric that is not "not found"
      const hasValue = products.some(product => {
        const key = `${product.id}-${metric.id}`;
        const metricValue = valueMap.get(key);
        // Show metric if: value exists and is either researching OR has a value (not notFound)
        return metricValue && (metricValue.isResearching || !metricValue.notFound);
      });
      return hasValue;
    });
  }, [metrics, products, valueMap]);

  const getValue = (productId: string, metricId: string): MetricValue | undefined => {
    const key = `${productId}-${metricId}`;
    return valueMap.get(key);
  };

  const renderCell = (productId: string, metricId: string) => {
    const metricValue = getValue(productId, metricId);

    if (!metricValue) {
      return <td key={`${productId}-${metricId}`} className="comparison-cell empty">-</td>;
    }

    if (metricValue.isResearching) {
      return (
        <td key={`${productId}-${metricId}`} className="comparison-cell researching">
          <span className="magnifying-glass">🔍</span>
        </td>
      );
    }

    if (metricValue.notFound) {
      return <td key={`${productId}-${metricId}`} className="comparison-cell not-found">-</td>;
    }

    return (
      <td key={`${productId}-${metricId}`} className="comparison-cell">
        {metricValue.value}
      </td>
    );
  };

  return (
    <div className="comparison-table-container">
      <table className="comparison-table">
        <thead>
          <tr>
            <th className="metric-header">Metric</th>
            {products.map(product => (
              <th key={product.id} className="product-header">
                <div className="product-name">{product.name}</div>
                <div className="product-price">
                  {product.currency || '$'}{product.price.toFixed(2)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleMetrics.map(metric => (
            <tr key={metric.id} className="metric-row">
              <td className="metric-name">{metric.name}</td>
              {products.map(product => renderCell(product.id, metric.id))}
            </tr>
          ))}
        </tbody>
      </table>
      {visibleMetrics.length === 0 && products.length > 0 && (
        <div className="no-metrics">No metrics available to display</div>
      )}
    </div>
  );
};
