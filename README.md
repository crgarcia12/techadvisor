# TechAdvisor - Azure AI Foundry LLM Provider & Clarifying Chat

A pluggable Azure AI Foundry LLM provider with session-based clarifying chat capabilities. The system asks specific narrowing questions to disambiguate user requests and degrades gracefully when credentials are not provided.

## Features

- ✅ **Pluggable LLM Provider**: Single-file Azure AI Foundry provider with clean interface
- ✅ **Clarifying Chat**: Session-based chat that asks only narrowing questions
- ✅ **Graceful Degradation**: Runs without LLM when credentials are missing
- ✅ **RESTful API**: Clean REST endpoints for chat interaction
- ✅ **Web Interface**: Simple, beautiful chat UI for testing

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Azure AI Foundry (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure AI Foundry credentials
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

### With Docker

```bash
# Build
docker build -t techadvisor .

# Run without LLM (fallback mode)
docker run -p 3000:3000 techadvisor

# Run with Azure AI Foundry
docker run -p 3000:3000 \
  -e AZURE_FOUNDRY_ENDPOINT=https://your-endpoint.openai.azure.com \
  -e AZURE_FOUNDRY_API_KEY=your-api-key \
  techadvisor
```

## API Endpoints

### Health Check
```bash
GET /health
```
Returns server status and LLM configuration state.

### Create Session
```bash
POST /api/chat/session
```
Returns a new session ID for chat interaction.

### Get Session
```bash
GET /api/chat/session/:sessionId
```
Retrieve session details and message history.

### Delete Session
```bash
DELETE /api/chat/session/:sessionId
```
Clear a chat session.

### Send Message
```bash
POST /api/chat/clarify
Body: {
  "sessionId": "uuid",
  "message": "I need help with my project"
}
```
Send a message and receive a clarifying question.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_FOUNDRY_ENDPOINT` | No | - | Azure AI Foundry endpoint URL |
| `AZURE_FOUNDRY_API_KEY` | No | - | Azure AI Foundry API key |
| `AZURE_FOUNDRY_DEPLOYMENT_ID` | No | `gpt-4` | Deployment/model ID |
| `PORT` | No | `3000` | Server port |

**Note:** When `AZURE_FOUNDRY_ENDPOINT` and `AZURE_FOUNDRY_API_KEY` are not provided, the application runs in fallback mode without LLM features.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Architecture

### Components

1. **LLM Provider** (`src/llm/azure-foundry-provider.ts`)
   - Single-file implementation
   - Pluggable interface for future providers
   - Graceful degradation without credentials
   - Proper error handling

2. **Clarifying Chat** (`src/chat/clarifying-chat.ts`)
   - Session-based conversation tracking
   - Focuses on narrowing questions only
   - In-memory session storage
   - Automatic cleanup of old sessions

3. **API Server** (`src/server.ts`)
   - Express.js REST API
   - Static file serving for web UI
   - Health check endpoint
   - Proper error handling

## Deployment

The application follows the [Liliput Deploy Contract](./LILIPUT_DEPLOY_CONTRACT.md):

- ✅ Binds to `0.0.0.0:$PORT`
- ✅ Serves all routes at `/` (prefix is stripped by nginx)
- ✅ Never emits `Location` headers with the prefix
- ✅ Uses `mcr.microsoft.com` base images
- ✅ Proper health check endpoint

## License

ISC
