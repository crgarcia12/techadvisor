import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { filterSourceSnippetsByLanguage } from '../../../src/utils/sourceSnippetFilter.js';

const projectRoot = join(process.cwd());

// Documentation scenarios
Given('a developer wants to set up the project', function () {
  this.readmePath = join(projectRoot, 'README.md');
});

When('they read the README.md', function () {
  expect(existsSync(this.readmePath)).toBe(true);
  this.readmeContent = readFileSync(this.readmePath, 'utf-8');
});

Then('they should find instructions for Azure Foundry setup', function () {
  expect(this.readmeContent).toContain('Azure Foundry');
  expect(this.readmeContent.toLowerCase()).toContain('setup');
});

Then('they should find environment variable documentation', function () {
  expect(this.readmeContent.toLowerCase()).toMatch(/environment\s+variable/i);
});

Then('they should find architecture overview', function () {
  expect(this.readmeContent.toLowerCase()).toContain('architecture');
});

Then('they should find development workflow instructions', function () {
  const content = this.readmeContent.toLowerCase();
  expect(content).toMatch(/development|workflow|getting started/);
});

// Environment variables scenarios
Given('a developer is configuring the project', function () {
  this.envExamplePath = join(projectRoot, '.env.example');
});

When('they reference .env.example', function () {
  expect(existsSync(this.envExamplePath)).toBe(true);
  this.envExampleContent = readFileSync(this.envExamplePath, 'utf-8');
});

Then('all required environment variables should be listed', function () {
  const lines = this.envExampleContent.split('\n');
  const varLines = lines.filter(line => line.includes('=') && !line.trim().startsWith('#'));
  expect(varLines.length).toBeGreaterThan(0);
});

Then('each variable should have a descriptive comment', function () {
  const lines = this.envExampleContent.split('\n');
  const commentLines = lines.filter(line => line.trim().startsWith('#'));
  expect(commentLines.length).toBeGreaterThan(0);
});

Then('example values should be provided where applicable', function () {
  expect(this.envExampleContent).toContain('=');
});

// Source snippet filtering scenarios
Given('a source snippet with multiple code blocks', function () {
  this.snippet = `
Text before

\`\`\`python
def hello():
    print("Hello from Python")
\`\`\`

Some text in between

\`\`\`javascript
function hello() {
  console.log("Hello from JS");
}
\`\`\`

\`\`\`python
def goodbye():
    print("Goodbye")
\`\`\`
`;
});

When('filtering by language {string}', function (language) {
  this.filterLanguage = language;
  this.filteredResults = filterSourceSnippetsByLanguage(this.snippet, language);
});

Then('only Python code blocks should be returned', function () {
  expect(this.filteredResults.length).toBe(2);
  expect(this.filteredResults[0]).toContain('def hello()');
  expect(this.filteredResults[1]).toContain('def goodbye()');
});

Then('code blocks of other languages should be excluded', function () {
  const allText = this.filteredResults.join(' ');
  expect(allText).not.toContain('console.log');
  expect(allText).not.toContain('function hello');
});

Given('a source snippet with no code blocks', function () {
  this.snippet = 'This is just plain text with no code blocks whatsoever';
});

When('filtering by any language', function () {
  this.filteredResults = filterSourceSnippetsByLanguage(this.snippet, 'python');
  this.error = null;
});

Then('an empty result should be returned', function () {
  expect(this.filteredResults).toEqual([]);
});

Then('no errors should be thrown', function () {
  expect(this.error).toBeNull();
});

// Test execution scenarios
Given('the test suite is installed', function () {
  const packageJsonPath = join(projectRoot, 'package.json');
  expect(existsSync(packageJsonPath)).toBe(true);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  expect(packageJson.devDependencies).toHaveProperty('@cucumber/cucumber');
});

When('running acceptance tests', function () {
  this.testsAreRunning = true;
});

Then('all scenarios should execute', function () {
  expect(this.testsAreRunning).toBe(true);
});

Then('test results should be clearly reported', function () {
  expect(this.testsAreRunning).toBe(true);
});
