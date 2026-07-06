import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const TIMEOUT_MS = 10000; // 10 seconds

/**
 * Crawls a product listing URL and extracts specifications
 * @param {string} url - The URL to crawl
 * @returns {Promise<Object>} Product data with title, specs, and raw HTML
 */
export async function crawlUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TechAdvisor/1.0 (Product Specification Crawler)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract product title
    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() || 
                  'Unknown Product';

    // Extract specifications (common patterns)
    const specs = {};
    
    // Look for spec tables
    $('table.specs tr, table.specifications tr, .spec-table tr').each((_, row) => {
      const $row = $(row);
      const label = $row.find('th, td:first-child, .spec-label').text().trim();
      const value = $row.find('td:last-child, .spec-value').text().trim();
      
      if (label && value && label !== value) {
        specs[label] = value;
      }
    });

    // Look for definition lists
    $('dl.specs dt, dl.specifications dt').each((_, dt) => {
      const $dt = $(dt);
      const label = $dt.text().trim();
      const value = $dt.next('dd').text().trim();
      
      if (label && value) {
        specs[label] = value;
      }
    });

    // Look for spec divs with class patterns
    $('.spec-item, .specification').each((_, item) => {
      const $item = $(item);
      const label = $item.find('.label, .name, strong').first().text().trim();
      const value = $item.find('.value, .detail, span').last().text().trim();
      
      if (label && value && label !== value) {
        specs[label] = value;
      }
    });

    return {
      url,
      title,
      specs,
      rawHtml: html,
      crawledAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
