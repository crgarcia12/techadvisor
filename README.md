# TechAdvisor - Azure Foundry Technical Advisory System

An AI-powered technical advisory system built on Azure Foundry, providing intelligent code analysis, snippet filtering, and technical guidance.

## Architecture Overview

TechAdvisor is a Node.js-based application designed to:
- Extract and filter code snippets from technical documentation
- Provide language-specific code analysis
- Offer intelligent technical recommendations

### Key Components

- **Source Snippet Filter** (`src/utils/sourceSnippetFilter.js`): Core utility for extracting and filtering code blocks by programming language
- **Main Application** (`src/index.js`): Entry point and orchestration layer
- **Test Suite**: Comprehensive unit and acceptance tests

## Azure Foundry Setup

### Prerequisites

- Node.js 18+ installed
- Azure CLI authenticated (`az login`)
- Access to Azure subscription with required permissions
- Azure Foundry environment configured

### Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your Azure credentials and configuration values. See the **Environment Variables** section below for details.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd techadvisor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see `.env.example`)

4. Run the application:
   ```bash
   npm run dev
   ```

## Development Workflow

### Running Tests

Run all tests (unit + acceptance):
```bash
npm test
```

Run only unit tests:
```bash
npm run test:unit
```

Run only acceptance tests:
```bash
npm run test:acceptance
```

### Project Structure

```
techadvisor/
├── src/
│   ├── index.js              # Application entry point
│   └── utils/
│       └── sourceSnippetFilter.js  # Code snippet filtering utilities
├── tests/
│   ├── unit/                 # Unit tests (Vitest)
│   │   └── sourceSnippetFilter.test.js
│   └── acceptance/           # Acceptance tests (Cucumber)
│       ├── features/
│       │   └── docs-and-tests.feature
│       └── step-definitions/
│           └── steps.js
├── specs/                    # Feature specifications
│   └── features/
│       └── 05-docs-and-tests.feature.md
├── .env.example              # Environment variable template
├── package.json              # Node.js dependencies and scripts
└── README.md                 # This file
```

## Environment Variables

The following environment variables are required for Azure Foundry integration:

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID for resource access | Yes |
| `AZURE_TENANT_ID` | Azure AD tenant ID for authentication | Yes |
| `AZURE_CLIENT_ID` | Service principal client ID | Yes |
| `AZURE_CLIENT_SECRET` | Service principal secret | Yes |
| `AZURE_RESOURCE_GROUP` | Resource group name for deployments | Yes |
| `AZURE_LOCATION` | Azure region (e.g., eastus, westus2) | Yes |
| `PORT` | Application port (default: 3000) | No |
| `NODE_ENV` | Environment mode (development, production) | No |

See `.env.example` for a complete template with example values.

## Deployment

### Liliput Development Preview

This application is configured for deployment via Liliput behind a path-stripping reverse proxy. The application serves all routes at `/` - the proxy handles path prefixing automatically.

Key deployment notes:
- Application binds to `0.0.0.0:${PORT}`
- All routes served at root path (`/`)
- No manual path prefix handling required in code
- See `LILIPUT_DEPLOY_CONTRACT.md` for complete deployment requirements

### Azure Foundry Production Deployment

For production deployment to Azure Foundry:

1. Ensure all environment variables are configured in Azure Key Vault
2. Build the application: `npm run build`
3. Deploy using Azure CLI or CI/CD pipeline
4. Verify health endpoint: `https://<your-app>.azurewebsites.net/health`

## Testing Methodology

### Unit Tests (Vitest)

- Located in `tests/unit/`
- Test individual functions and utilities
- Fast execution, no external dependencies
- Run with: `npm run test:unit`

### Acceptance Tests (Cucumber + Playwright)

- Located in `tests/acceptance/`
- Validate complete user scenarios
- Cover all acceptance criteria from feature specifications
- Run with: `npm run test:acceptance`

## Contributing

1. Create a feature branch from `main`
2. Write tests first (TDD approach)
3. Implement features to pass tests
4. Ensure all tests pass: `npm test`
5. Submit pull request for review

## License

MIT
