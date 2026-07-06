# Feature: Live Comparison Table & Researching Indicators

## Overview
Frontend comparison table component that dynamically adds product columns, displays animated researching indicators, aligns metric rows in real-time, and omits unavailable metrics.

## User Stories

### US-1: Display Product Columns with Prices
**As a** user comparing products  
**I want to** see product names and prices in column headers  
**So that** I can quickly identify and compare product costs

**Acceptance Criteria:**
- Product columns display product name
- Product columns display formatted price with currency symbol
- Columns are added dynamically as products are added to the comparison

### US-2: Show Animated Research Indicators
**As a** user waiting for metric data  
**I want to** see animated magnifying glass icons in cells  
**So that** I know the system is actively researching that metric

**Acceptance Criteria:**
- Cells display animated magnifying glass (🔍) while researching
- Animation is smooth and continuous (pulsing effect)
- Research indicator disappears once data is available

### US-3: Align Shared Metric Rows
**As a** user reviewing metrics  
**I want to** see metrics aligned in rows across products  
**So that** I can easily compare the same metric across products

**Acceptance Criteria:**
- Each metric gets its own row
- Metric rows align automatically as products are added
- Metric name appears in the leftmost column
- Values align horizontally for easy comparison

### US-4: Omit Unavailable Metrics
**As a** user focused on available data  
**I want** metrics that aren't found to be hidden  
**So that** the table shows only relevant information

**Acceptance Criteria:**
- Rows are hidden if all products have "not found" for that metric
- Rows are visible if at least one product has a value
- Rows remain visible while any product is still researching that metric
- Empty state message shown when no metrics are available

## Implementation Details

### Component Structure
- `ComparisonTable.tsx`: Main component
- `types.ts`: TypeScript interfaces
- `ComparisonTable.css`: Styling and animations
- `ComparisonTable.test.tsx`: Test coverage

### Data Model
```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  currency?: string;
}

interface Metric {
  id: string;
  name: string;
  category?: string;
}

interface MetricValue {
  productId: string;
  metricId: string;
  value: string | number | null;
  isResearching: boolean;
  notFound?: boolean;
}
```

### Key Features
1. **Dynamic Row Filtering**: Uses `useMemo` to compute visible metrics based on current value states
2. **Efficient Lookups**: Value map for O(1) metric value retrieval
3. **CSS Animations**: Keyframe animation for magnifying glass pulse effect
4. **Responsive Layout**: Sticky headers and horizontal scroll for mobile

## Test Coverage

✅ **8 test cases covering:**
- Product column rendering with prices
- Animated magnifying glass display during research
- Metric value display after research completes
- Row omission when all values are not found
- Row visibility with partial data availability
- Row visibility during active research
- Empty state handling
- Dynamic product addition

## Demo Application

The `App.tsx` demonstrates the component with:
- 3 sample products
- 6 sample metrics
- Simulated progressive data loading with staggered timing
- Mixed states: researching, found, and not-found values

## Deployment

Configured for Liliput deployment:
- Base path: `/dev/crgarcia12/techadvisor/liliput-task-2a1a850a`
- Vite build with correct asset prefixing
- Docker container serving on `0.0.0.0:$PORT`
- MCR base images (avoiding Docker Hub rate limits)
