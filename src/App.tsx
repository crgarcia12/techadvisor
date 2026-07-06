import { useState, useEffect } from 'react';
import { ComparisonTable } from './components/ComparisonTable';
import type { ComparisonData, MetricValue } from './components/types';
import './App.css';

function App() {
  const [data, setData] = useState<ComparisonData>({
    products: [
      { id: 'p1', name: 'Product A', price: 99.99, currency: '$' },
      { id: 'p2', name: 'Product B', price: 149.99, currency: '$' },
      { id: 'p3', name: 'Product C', price: 199.99, currency: '$' },
    ],
    metrics: [
      { id: 'm1', name: 'Performance Score', category: 'Performance' },
      { id: 'm2', name: 'Battery Life', category: 'Hardware' },
      { id: 'm3', name: 'Storage', category: 'Hardware' },
      { id: 'm4', name: 'RAM', category: 'Hardware' },
      { id: 'm5', name: 'Display Quality', category: 'Display' },
      { id: 'm6', name: 'Camera Resolution', category: 'Camera' },
    ],
    values: [],
  });

  // Simulate progressive data loading
  useEffect(() => {
    // Initial state: all metrics are "researching"
    const initialValues: MetricValue[] = [];
    data.products.forEach(product => {
      data.metrics.forEach(metric => {
        initialValues.push({
          productId: product.id,
          metricId: metric.id,
          value: null,
          isResearching: true,
        });
      });
    });
    setData(prev => ({ ...prev, values: initialValues }));

    // Simulate data arriving over time
    const mockData: Record<string, Record<string, string | number | null>> = {
      p1: {
        m1: 8.5,
        m2: '12 hours',
        m3: '256 GB',
        m4: '8 GB',
        m5: '1080p',
        // m6 will be marked as notFound
      },
      p2: {
        m1: 9.2,
        m2: '15 hours',
        m3: '512 GB',
        m4: '16 GB',
        m5: '4K',
        m6: '48 MP',
      },
      p3: {
        m1: 9.8,
        m2: '10 hours',
        m3: '1 TB',
        m4: '32 GB',
        m5: '4K HDR',
        m6: '108 MP',
      },
    };

    // Gradually resolve researching states
    const timeouts: NodeJS.Timeout[] = [];
    
    data.products.forEach((product, pIdx) => {
      data.metrics.forEach((metric, mIdx) => {
        const delay = (pIdx * 3 + mIdx) * 500; // Stagger the updates
        const timeout = setTimeout(() => {
          setData(prev => {
            const newValues = prev.values.map(v => {
              if (v.productId === product.id && v.metricId === metric.id) {
                const value = mockData[product.id]?.[metric.id];
                if (value === undefined) {
                  // Mark as not found
                  return { ...v, isResearching: false, notFound: true, value: null };
                }
                return { ...v, isResearching: false, value };
              }
              return v;
            });
            return { ...prev, values: newValues };
          });
        }, delay);
        timeouts.push(timeout);
      });
    });

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, []); // Only run on mount

  return (
    <div className="app">
      <header className="app-header">
        <h1>TechAdvisor Product Comparison</h1>
        <p>Compare products side-by-side with live metric research</p>
      </header>
      <main className="app-main">
        <ComparisonTable data={data} />
      </main>
    </div>
  );
}

export default App;
