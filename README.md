# TechAdvisor - Product Comparison Table

A React-based frontend application for comparing product features side-by-side with live metric research indicators.

## Features

- **Dynamic Product Columns**: Add products with prices displayed prominently
- **Animated Research Indicators**: Magnifying glass icons pulse while metrics are being researched
- **Real-time Row Alignment**: Metrics shared across products align automatically as data arrives
- **Smart Row Filtering**: Metrics not found or unavailable are omitted from the table
- **Responsive Design**: Works on desktop and mobile devices

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This app is configured for deployment on Liliput with path-stripping reverse proxy support:

- Base path: `/dev/crgarcia12/techadvisor/liliput-task-2a1a850a`
- Server binds to: `0.0.0.0:${PORT}`
- Assets are properly prefixed in build output

See `LILIPUT_DEPLOY_CONTRACT.md` for deployment details.

## Component API

### ComparisonTable

```tsx
import { ComparisonTable } from './components/ComparisonTable';

const data = {
  products: [
    { id: 'p1', name: 'Product A', price: 99.99, currency: '$' }
  ],
  metrics: [
    { id: 'm1', name: 'Performance Score' }
  ],
  values: [
    {
      productId: 'p1',
      metricId: 'm1',
      value: 8.5,
      isResearching: false
    }
  ]
};

<ComparisonTable data={data} />
```

## Tech Stack

- React 18
- TypeScript
- Vite
- Vitest + Testing Library
- CSS Animations
