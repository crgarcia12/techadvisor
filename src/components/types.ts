export interface Product {
  id: string;
  name: string;
  price: number;
  currency?: string;
}

export interface Metric {
  id: string;
  name: string;
  category?: string;
}

export interface MetricValue {
  productId: string;
  metricId: string;
  value: string | number | null;
  isResearching: boolean;
  notFound?: boolean;
}

export interface ComparisonData {
  products: Product[];
  metrics: Metric[];
  values: MetricValue[];
}
