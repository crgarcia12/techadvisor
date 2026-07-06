/**
 * Source Snippet Filtering Utility
 * 
 * Filters code blocks from source snippets by programming language.
 * Used by TechAdvisor to extract relevant code examples.
 */

/**
 * Filters code blocks by language from a source snippet
 * @param {string} snippet - The source snippet containing code blocks
 * @param {string} language - The language to filter (e.g., 'python', 'javascript', 'typescript')
 * @returns {string[]} Array of matching code blocks
 */
export function filterSourceSnippetsByLanguage(snippet, language) {
  if (!snippet || typeof snippet !== 'string') {
    return [];
  }

  if (!language || typeof language !== 'string') {
    return [];
  }

  const codeBlocks = [];
  const normalizedLanguage = language.toLowerCase().trim();
  
  // Regex to match markdown code blocks with language specifiers
  // Pattern: ```language\ncode\n```
  const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockRegex.exec(snippet)) !== null) {
    const blockLanguage = match[1].toLowerCase().trim();
    const blockCode = match[2];
    
    if (blockLanguage === normalizedLanguage) {
      codeBlocks.push(blockCode);
    }
  }
  
  return codeBlocks;
}

/**
 * Gets all code blocks from a snippet regardless of language
 * @param {string} snippet - The source snippet containing code blocks
 * @returns {Array<{language: string, code: string}>} Array of code blocks with metadata
 */
export function extractAllCodeBlocks(snippet) {
  if (!snippet || typeof snippet !== 'string') {
    return [];
  }

  const codeBlocks = [];
  const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockRegex.exec(snippet)) !== null) {
    codeBlocks.push({
      language: match[1],
      code: match[2]
    });
  }
  
  return codeBlocks;
}
