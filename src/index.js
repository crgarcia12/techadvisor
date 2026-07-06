/**
 * TechAdvisor Entry Point
 * 
 * Main application entry for Azure Foundry TechAdvisor system
 */

import { filterSourceSnippetsByLanguage, extractAllCodeBlocks } from './utils/sourceSnippetFilter.js';

const PORT = process.env.PORT || 3000;

console.log(`TechAdvisor starting on port ${PORT}...`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Example usage of source snippet filtering
const exampleSnippet = `
Here's some Python code:
\`\`\`python
def hello():
    print("Hello from Python")
\`\`\`

And some JavaScript:
\`\`\`javascript
function hello() {
  console.log("Hello from JavaScript");
}
\`\`\`
`;

const pythonBlocks = filterSourceSnippetsByLanguage(exampleSnippet, 'python');
console.log('Python blocks found:', pythonBlocks.length);

const allBlocks = extractAllCodeBlocks(exampleSnippet);
console.log('Total code blocks:', allBlocks.length);

console.log('TechAdvisor initialized successfully');
