# TechAdvisor API

Product specification crawler and metric extraction service.

## Features

- **POST /products** - Crawl product listing URLs and extract specifications
  - Accepts an array of URLs
  - Crawls each URL with configurable timeout (10s default)
  - Extracts product specifications using common HTML patterns
  - Normalizes metrics into standard categories
  - Includes source snippet traceability for each metric
  - Streams results as Server-Sent Events (SSE)

## API Endpoints

### GET /
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "techadvisor"
}
```

### POST /products
Crawl product URLs and extract specifications.

**Request Body:**
```json
{
  "urls": [
    "https://example.com/product1",
    "https://example.com/product2"
  ]
}
```

**Response:** Server-Sent Events stream

**Event Types:**
- `status` - Crawling status updates
- `metric:update` - Extracted metric with source snippet
- `error` - Error during crawling or extraction
- `complete` - All URLs processed

**Example SSE Response:**
```
event: status
data: {"url":"https://example.com/laptop","status":"crawling"}

event: status
data: {"url":"https://example.com/laptop","status":"extracting"}

event: metric:update
data: {"category":"processor","originalKey":"CPU","value":"Intel Core i7","sourceSnippet":"<div class=\"spec\">CPU: Intel Core i7</div>","url":"https://example.com/laptop","extractedAt":"2026-07-06T05:38:32.042Z"}

event: metric:update
data: {"category":"memory","originalKey":"RAM","value":"16GB","sourceSnippet":"...","url":"https://example.com/laptop","extractedAt":"2026-07-06T05:38:32.042Z"}

event: status
data: {"url":"https://example.com/laptop","status":"complete","metricsCount":2}

event: complete
data: {"processedUrls":1,"timestamp":"2026-07-06T05:38:32.042Z"}
```

## Development

### Install Dependencies
```bash
npm install
```

### Run Tests
```bash
npm test
```

### Start Development Server
```bash
npm run dev
```

### Start Production Server
```bash
npm start
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment mode (development/production)

## Architecture

### Components

1. **crawler.js** - URL crawling with timeout handling
   - Uses node-fetch with AbortController for timeout management
   - Extracts product data using cheerio
   - Handles common HTML specification patterns

2. **extractMetrics.js** - Metric extraction and normalization
   - Normalizes specification names to standard categories
   - Includes source snippet filtering for traceability
   - Maps common variations (CPU/Processor, RAM/Memory, etc.)

3. **app.js** - Express application with SSE endpoint
   - Validates request body
   - Streams processing events in real-time
   - Handles errors gracefully

## Deployment

The service runs on port 8080 by default and is containerized using Docker with the Azure Linux Node.js base image.

### Docker Build
```bash
docker build -t techadvisor .
```

### Docker Run
```bash
docker run -p 8080:8080 techadvisor
```

## Testing

The test suite uses Jest with ES modules support and includes:
- SSE stream validation
- Timeout handling verification
- Source snippet extraction tests
- Input validation tests
- Multi-URL processing tests

Run tests with:
```bash
npm test
```
