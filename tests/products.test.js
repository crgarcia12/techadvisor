import request from 'supertest';
import { jest } from '@jest/globals';

// Mock the crawler module
const mockCrawl = jest.fn();
jest.unstable_mockModule('../src/crawler.js', () => ({
  crawlUrl: mockCrawl,
}));

// Import app after mocking
const { default: app } = await import('../src/app.js');

describe('POST /products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should accept listing URLs and return SSE stream', async () => {
    mockCrawl.mockResolvedValue({
      title: 'Sample Product',
      specs: {
        'Processor': 'Intel Core i7',
        'RAM': '16GB DDR4',
      },
    });

    const response = await request(app)
      .post('/products')
      .send({ urls: ['https://example.com/product1'] })
      .set('Accept', 'text/event-stream');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('event: metric:update');
  });

  test('should handle timeout errors gracefully', async () => {
    mockCrawl.mockRejectedValue(new Error('Request timeout'));

    const response = await request(app)
      .post('/products')
      .send({ urls: ['https://example.com/slow-product'] })
      .set('Accept', 'text/event-stream');

    expect(response.status).toBe(200);
    expect(response.text).toContain('event: error');
    expect(response.text).toContain('timeout');
  });

  test('should extract metrics with sourceSnippet', async () => {
    mockCrawl.mockResolvedValue({
      title: 'Gaming Laptop',
      specs: {
        'CPU': 'AMD Ryzen 9',
        'GPU': 'NVIDIA RTX 4090',
      },
      rawHtml: '<div class="spec">CPU: AMD Ryzen 9</div>',
    });

    const response = await request(app)
      .post('/products')
      .send({ urls: ['https://example.com/gaming-laptop'] })
      .set('Accept', 'text/event-stream');

    expect(response.status).toBe(200);
    expect(response.text).toContain('sourceSnippet');
    expect(response.text).toContain('AMD Ryzen 9');
  });

  test('should require urls array in request body', async () => {
    const response = await request(app)
      .post('/products')
      .send({})
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('urls');
  });

  test('should stream multiple metric:update events for multiple URLs', async () => {
    mockCrawl
      .mockResolvedValueOnce({
        title: 'Product 1',
        specs: { 'RAM': '8GB' },
      })
      .mockResolvedValueOnce({
        title: 'Product 2',
        specs: { 'RAM': '16GB' },
      });

    const response = await request(app)
      .post('/products')
      .send({ urls: ['https://example.com/p1', 'https://example.com/p2'] })
      .set('Accept', 'text/event-stream');

    expect(response.status).toBe(200);
    const eventCount = (response.text.match(/event: metric:update/g) || []).length;
    expect(eventCount).toBeGreaterThanOrEqual(2);
  });
});
