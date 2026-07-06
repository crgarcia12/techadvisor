import express from 'express';
import { crawlUrl } from './crawler.js';
import { extractMetrics } from './extractMetrics.js';

const app = express();

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'techadvisor' });
});

// POST /products - Crawl listing URLs and stream metric updates
app.post('/products', async (req, res) => {
  const { urls } = req.body;

  // Validate input
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ 
      error: 'Request body must contain a non-empty "urls" array' 
    });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Process each URL
  for (const url of urls) {
    try {
      sendEvent('status', { url, status: 'crawling' });

      // Crawl the URL with timeout handling
      const productData = await crawlUrl(url);

      sendEvent('status', { url, status: 'extracting' });

      // Extract and normalize metrics with sourceSnippet filtering
      const metrics = extractMetrics(productData);

      // Emit metric:update events for each extracted metric
      for (const metric of metrics) {
        sendEvent('metric:update', metric);
      }

      sendEvent('status', { url, status: 'complete', metricsCount: metrics.length });
    } catch (error) {
      // Handle errors gracefully (including timeouts)
      sendEvent('error', { 
        url, 
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Signal completion
  sendEvent('complete', { 
    processedUrls: urls.length,
    timestamp: new Date().toISOString(),
  });

  res.end();
});

export default app;
