# Feature: Crawler & Source-Traceable Metric Extraction

**Feature ID:** 03-crawler-metric-extraction  
**Workstream:** (default)  
**Issue:** #3

## Overview

POST /products endpoint that crawls product listing URLs with timeout handling, extracts and normalizes product specifications using an extractMetrics function with mandatory sourceSnippet filtering, and emits metric:update events as a server-sent event stream during processing.

## Acceptance Scenarios (Gherkin)

### Scenario: Successfully crawl and extract product metrics
```gherkin
Given a valid product listing URL
When the client POSTs to /products with the URL
Then the server returns a 200 status
And the response is a text/event-stream
And metric:update events are emitted
And each metric includes a sourceSnippet field
And each metric includes url, category, value, and extractedAt fields
```

### Scenario: Handle crawling timeout
```gherkin
Given a product URL that times out
When the client POSTs to /products with the URL
Then the server returns a 200 status
And an error event is emitted
And the error message contains "timeout"
```

### Scenario: Normalize metric categories
```gherkin
Given a product page with "CPU: Intel Core i7"
When metrics are extracted
Then the metric category is normalized to "processor"
And the originalKey is preserved as "CPU"
And the sourceSnippet includes the original HTML fragment
```

### Scenario: Validate request body
```gherkin
Given an empty request body
When the client POSTs to /products
Then the server returns a 400 status
And the error message indicates "urls" is required
```

### Scenario: Process multiple URLs
```gherkin
Given multiple product URLs
When the client POSTs to /products with all URLs
Then metric:update events are emitted for each URL
And a complete event is emitted at the end
And the complete event includes processedUrls count
```

## Technical Implementation

### Components

1. **crawler.js** - URL crawling with timeout
   - 10-second timeout using AbortController
   - Cheerio-based HTML parsing
   - Supports multiple HTML specification patterns (tables, definition lists, divs)

2. **extractMetrics.js** - Metric extraction and normalization
   - Maps variations to standard categories (CPU→processor, RAM→memory)
   - Mandatory sourceSnippet extraction from raw HTML
   - Includes extraction timestamp and source URL

3. **app.js** - Express app with SSE endpoint
   - POST /products endpoint
   - Request validation (urls array required)
   - Server-Sent Events streaming
   - Error handling for timeouts and network failures

### SSE Event Types

- `status` - Processing status updates (crawling, extracting, complete)
- `metric:update` - Extracted metric with full metadata
- `error` - Error during crawling or extraction
- `complete` - All URLs processed summary

### Metric Data Structure

```json
{
  "category": "processor",
  "originalKey": "CPU",
  "value": "Intel Core i7",
  "sourceSnippet": "<div class=\"spec\">CPU: Intel Core i7</div>",
  "url": "https://example.com/product",
  "extractedAt": "2026-07-06T05:38:32.042Z"
}
```

## Testing

- 5 test cases covering all acceptance scenarios
- Mocked crawler for unit testing
- Integration tests with SSE stream parsing
- Timeout and error handling verification

## Definition of Done

- [x] POST /products endpoint implemented
- [x] Timeout handling with AbortController
- [x] extractMetrics function with sourceSnippet filtering
- [x] SSE streaming of metric:update events
- [x] All tests passing (5/5)
- [x] Request validation
- [x] Error handling for timeouts and network failures
- [x] Dockerfile configured per Liliput deploy contract
- [x] API documentation created
