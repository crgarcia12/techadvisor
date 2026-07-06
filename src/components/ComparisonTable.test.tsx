import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from './ComparisonTable';
import type { ComparisonData } from './types';

describe('ComparisonTable', () => {
  const baseData: ComparisonData = {
    products: [
      { id: 'p1', name: 'Product A', price: 99.99, currency: '$' },
      { id: 'p2', name: 'Product B', price: 149.99, currency: '$' },
    ],
    metrics: [
      { id: 'm1', name: 'Performance' },
      { id: 'm2', name: 'Battery Life' },
    ],
    values: [],
  };

  it('renders product columns with names and prices', () => {
    render(<ComparisonTable data={baseData} />);
    
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('displays animated magnifying glass for researching metrics', () => {
    const dataWithResearching: ComparisonData = {
      ...baseData,
      values: [
        {
          productId: 'p1',
          metricId: 'm1',
          value: null,
          isResearching: true,
        },
      ],
    };

    const { container } = render(<ComparisonTable data={dataWithResearching} />);
    
    const magnifyingGlass = container.querySelector('.magnifying-glass');
    expect(magnifyingGlass).toBeInTheDocument();
    expect(magnifyingGlass?.textContent).toBe('🔍');
  });

  it('displays metric values when research is complete', () => {
    const dataWithValues: ComparisonData = {
      ...baseData,
      values: [
        {
          productId: 'p1',
          metricId: 'm1',
          value: '8.5',
          isResearching: false,
        },
        {
          productId: 'p2',
          metricId: 'm1',
          value: '9.2',
          isResearching: false,
        },
      ],
    };

    render(<ComparisonTable data={dataWithValues} />);
    
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('9.2')).toBeInTheDocument();
  });

  it('omits metric rows when all values are not found', () => {
    const dataWithNotFound: ComparisonData = {
      ...baseData,
      values: [
        {
          productId: 'p1',
          metricId: 'm1',
          value: null,
          isResearching: false,
          notFound: true,
        },
        {
          productId: 'p2',
          metricId: 'm1',
          value: null,
          isResearching: false,
          notFound: true,
        },
        {
          productId: 'p1',
          metricId: 'm2',
          value: '10 hours',
          isResearching: false,
        },
      ],
    };

    render(<ComparisonTable data={dataWithNotFound} />);
    
    // Performance row should not be visible (all not found)
    expect(screen.queryByText('Performance')).not.toBeInTheDocument();
    
    // Battery Life row should be visible (has at least one value)
    expect(screen.getByText('Battery Life')).toBeInTheDocument();
  });

  it('shows metric row if at least one product has a value', () => {
    const dataPartialValues: ComparisonData = {
      ...baseData,
      values: [
        {
          productId: 'p1',
          metricId: 'm1',
          value: '8.5',
          isResearching: false,
        },
        {
          productId: 'p2',
          metricId: 'm1',
          value: null,
          isResearching: false,
          notFound: true,
        },
      ],
    };

    render(<ComparisonTable data={dataPartialValues} />);
    
    // Metric row should be visible because p1 has a value
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  it('shows metric row if any product is still researching', () => {
    const dataStillResearching: ComparisonData = {
      ...baseData,
      values: [
        {
          productId: 'p1',
          metricId: 'm1',
          value: null,
          isResearching: true,
        },
        {
          productId: 'p2',
          metricId: 'm1',
          value: null,
          isResearching: false,
          notFound: true,
        },
      ],
    };

    const { container } = render(<ComparisonTable data={dataStillResearching} />);
    
    // Metric row should be visible because p1 is still researching
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(container.querySelector('.magnifying-glass')).toBeInTheDocument();
  });

  it('renders empty state when no metrics are visible', () => {
    const dataNoVisibleMetrics: ComparisonData = {
      ...baseData,
      values: [
        {
          productId: 'p1',
          metricId: 'm1',
          value: null,
          isResearching: false,
          notFound: true,
        },
        {
          productId: 'p2',
          metricId: 'm1',
          value: null,
          isResearching: false,
          notFound: true,
        },
        {
          productId: 'p1',
          metricId: 'm2',
          value: null,
          isResearching: false,
          notFound: true,
        },
        {
          productId: 'p2',
          metricId: 'm2',
          value: null,
          isResearching: false,
          notFound: true,
        },
      ],
    };

    render(<ComparisonTable data={dataNoVisibleMetrics} />);
    
    expect(screen.getByText('No metrics available to display')).toBeInTheDocument();
  });

  it('handles dynamic product addition', () => {
    const dataWithThreeProducts: ComparisonData = {
      products: [
        { id: 'p1', name: 'Product A', price: 99.99, currency: '$' },
        { id: 'p2', name: 'Product B', price: 149.99, currency: '$' },
        { id: 'p3', name: 'Product C', price: 199.99, currency: '$' },
      ],
      metrics: [{ id: 'm1', name: 'Performance' }],
      values: [
        { productId: 'p1', metricId: 'm1', value: '8.5', isResearching: false },
        { productId: 'p2', metricId: 'm1', value: '9.2', isResearching: false },
        { productId: 'p3', metricId: 'm1', value: '9.8', isResearching: false },
      ],
    };

    render(<ComparisonTable data={dataWithThreeProducts} />);
    
    expect(screen.getByText('Product C')).toBeInTheDocument();
    expect(screen.getByText('$199.99')).toBeInTheDocument();
    expect(screen.getByText('9.8')).toBeInTheDocument();
  });
});
