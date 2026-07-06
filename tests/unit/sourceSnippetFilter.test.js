import { describe, it, expect } from 'vitest';
import { filterSourceSnippetsByLanguage, extractAllCodeBlocks } from '../../src/utils/sourceSnippetFilter.js';

describe('Source Snippet Filtering', () => {
  describe('filterSourceSnippetsByLanguage', () => {
    it('should filter Python code blocks correctly', () => {
      const snippet = `
Some text here
\`\`\`python
def hello():
    print("Hello")
\`\`\`

More text
\`\`\`javascript
console.log("JS code");
\`\`\`

\`\`\`python
def goodbye():
    print("Goodbye")
\`\`\`
`;
      
      const result = filterSourceSnippetsByLanguage(snippet, 'python');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toContain('def hello()');
      expect(result[1]).toContain('def goodbye()');
    });

    it('should filter JavaScript code blocks correctly', () => {
      const snippet = `
\`\`\`javascript
function test() {
  return true;
}
\`\`\`

\`\`\`python
def test():
    return True
\`\`\`
`;
      
      const result = filterSourceSnippetsByLanguage(snippet, 'javascript');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('function test()');
    });

    it('should be case-insensitive for language matching', () => {
      const snippet = `
\`\`\`Python
def hello():
    pass
\`\`\`
`;
      
      const result = filterSourceSnippetsByLanguage(snippet, 'python');
      
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no matching code blocks', () => {
      const snippet = `
\`\`\`javascript
console.log("test");
\`\`\`
`;
      
      const result = filterSourceSnippetsByLanguage(snippet, 'python');
      
      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty snippet', () => {
      const result = filterSourceSnippetsByLanguage('', 'python');
      
      expect(result).toHaveLength(0);
    });

    it('should return empty array for null snippet', () => {
      const result = filterSourceSnippetsByLanguage(null, 'python');
      
      expect(result).toHaveLength(0);
    });

    it('should return empty array for undefined language', () => {
      const snippet = `\`\`\`python\ncode\`\`\``;
      const result = filterSourceSnippetsByLanguage(snippet, undefined);
      
      expect(result).toHaveLength(0);
    });

    it('should handle snippets with no code blocks', () => {
      const snippet = 'This is just plain text with no code blocks';
      const result = filterSourceSnippetsByLanguage(snippet, 'python');
      
      expect(result).toHaveLength(0);
    });

    it('should handle multiple languages in one snippet', () => {
      const snippet = `
\`\`\`typescript
const x: number = 5;
\`\`\`

\`\`\`python
x = 5
\`\`\`

\`\`\`javascript
const x = 5;
\`\`\`

\`\`\`typescript
interface Test {}
\`\`\`
`;
      
      const result = filterSourceSnippetsByLanguage(snippet, 'typescript');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toContain('const x: number');
      expect(result[1]).toContain('interface Test');
    });
  });

  describe('extractAllCodeBlocks', () => {
    it('should extract all code blocks with metadata', () => {
      const snippet = `
\`\`\`python
def hello():
    pass
\`\`\`

\`\`\`javascript
console.log("hi");
\`\`\`
`;
      
      const result = extractAllCodeBlocks(snippet);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        language: 'python',
        code: expect.stringContaining('def hello()')
      });
      expect(result[1]).toEqual({
        language: 'javascript',
        code: expect.stringContaining('console.log')
      });
    });

    it('should return empty array for snippet with no code blocks', () => {
      const result = extractAllCodeBlocks('Just plain text');
      
      expect(result).toHaveLength(0);
    });

    it('should return empty array for null input', () => {
      const result = extractAllCodeBlocks(null);
      
      expect(result).toHaveLength(0);
    });

    it('should preserve language casing in metadata', () => {
      const snippet = `\`\`\`Python\ncode\`\`\``;
      const result = extractAllCodeBlocks(snippet);
      
      expect(result[0].language).toBe('Python');
    });
  });
});
