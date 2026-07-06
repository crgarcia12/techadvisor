/**
 * Simple HTTP Server for TechAdvisor
 * Binds to 0.0.0.0:PORT for Liliput deployment
 */

import http from 'http';
import { filterSourceSnippetsByLanguage, extractAllCodeBlocks } from './utils/sourceSnippetFilter.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'techadvisor' }));
    return;
  }

  // Root endpoint with HTML
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TechAdvisor - Azure Foundry</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #0078d4; }
        .card {
            background: #f5f5f5;
            border-left: 4px solid #0078d4;
            padding: 20px;
            margin: 20px 0;
        }
        code {
            background: #e8e8e8;
            padding: 2px 6px;
            border-radius: 3px;
        }
        .status { color: #107c10; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🚀 TechAdvisor</h1>
    <p class="status">✓ Service is running</p>
    
    <div class="card">
        <h2>About</h2>
        <p>Azure Foundry TechAdvisor - AI-powered technical advisory system with intelligent code snippet filtering and analysis.</p>
    </div>
    
    <div class="card">
        <h2>Features</h2>
        <ul>
            <li>Source snippet filtering by programming language</li>
            <li>Multi-language code extraction</li>
            <li>RESTful API endpoints</li>
            <li>Comprehensive test coverage</li>
        </ul>
    </div>
    
    <div class="card">
        <h2>API Endpoints</h2>
        <ul>
            <li><code>GET /</code> - This page</li>
            <li><code>GET /health</code> - Health check</li>
            <li><code>GET /api/info</code> - Service information</li>
        </ul>
    </div>
    
    <div class="card">
        <h2>Documentation</h2>
        <p>See <code>README.md</code> for setup instructions, environment configuration, and development workflow.</p>
    </div>
</body>
</html>
    `);
    return;
  }

  // API info endpoint
  if (req.url === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'techadvisor',
      version: '1.0.0',
      description: 'Azure Foundry TechAdvisor - Code snippet filtering and analysis',
      features: [
        'Source snippet filtering',
        'Multi-language code extraction',
        'RESTful API'
      ],
      environment: process.env.NODE_ENV || 'development'
    }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`✓ TechAdvisor server running on http://${HOST}:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Health check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
