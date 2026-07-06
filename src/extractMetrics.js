/**
 * Extracts and normalizes metrics from product specifications
 * Includes sourceSnippet filtering for traceability
 * @param {Object} productData - Raw product data from crawler
 * @returns {Array<Object>} Array of normalized metrics with source snippets
 */
export function extractMetrics(productData) {
  const { specs, rawHtml, url } = productData;
  const metrics = [];

  // Normalize common spec names
  const normalizationMap = {
    'processor': ['processor', 'cpu', 'chipset', 'soc'],
    'memory': ['memory', 'ram', 'system memory'],
    'storage': ['storage', 'hard drive', 'ssd', 'disk'],
    'display': ['display', 'screen', 'screen size', 'panel'],
    'graphics': ['graphics', 'gpu', 'video card', 'graphics card'],
    'battery': ['battery', 'battery life', 'battery capacity'],
    'weight': ['weight', 'shipping weight'],
    'dimensions': ['dimensions', 'size'],
    'os': ['operating system', 'os', 'platform'],
    'connectivity': ['connectivity', 'wireless', 'wifi', 'bluetooth'],
  };

  // Process each spec
  for (const [originalKey, value] of Object.entries(specs)) {
    const keyLower = originalKey.toLowerCase();
    
    // Find normalized category
    let category = originalKey;
    for (const [normalizedName, aliases] of Object.entries(normalizationMap)) {
      if (aliases.some(alias => keyLower.includes(alias))) {
        category = normalizedName;
        break;
      }
    }

    // Extract source snippet from raw HTML
    const sourceSnippet = findSourceSnippet(rawHtml, originalKey, value);

    metrics.push({
      category,
      originalKey,
      value,
      sourceSnippet,
      url,
      extractedAt: new Date().toISOString(),
    });
  }

  return metrics;
}

/**
 * Finds the source HTML snippet where a metric was extracted from
 * @param {string} html - Raw HTML content
 * @param {string} key - The specification key
 * @param {string} value - The specification value
 * @returns {string} The source snippet with context
 */
function findSourceSnippet(html, key, value) {
  // Handle missing or invalid HTML
  if (!html || typeof html !== 'string') {
    return 'Source not available';
  }
  
  // Create a simple text representation without full DOM parsing
  const lines = html.split('\n');
  
  // Find lines containing both key and value (or near each other)
  const searchTerms = [key, value].filter(Boolean);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains any search terms
    const containsKey = searchTerms.some(term => 
      line.toLowerCase().includes(term.toLowerCase())
    );
    
    if (containsKey) {
      // Extract snippet with context (3 lines before and after)
      const start = Math.max(0, i - 1);
      const end = Math.min(lines.length, i + 2);
      const snippet = lines.slice(start, end).join('\n').trim();
      
      // Clean up the snippet
      const cleanSnippet = snippet
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/\s+/g, ' ')
        .substring(0, 200);
      
      return cleanSnippet || 'Source not available';
    }
  }
  
  return 'Source not available';
}
