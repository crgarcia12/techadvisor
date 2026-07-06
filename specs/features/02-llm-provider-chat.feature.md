# Feature: Azure AI Foundry LLM Provider & Clarifying Chat

## Overview
Implement a pluggable single-file Azure AI Foundry LLM provider and a session-based clarifying chat system. The clarifying chat must only ask narrowing questions to disambiguate user requests. Both components must degrade gracefully when Azure AI Foundry credentials or configuration are not provided.

## Acceptance Scenarios (Gherkin)

### Scenario: LLM provider degrades gracefully when unconfigured
Given the Azure AI Foundry credentials are not provided
When the application starts
Then the LLM provider should initialize in fallback mode
And the system should log a warning about missing configuration
And the application should remain operational without LLM capabilities

### Scenario: LLM provider connects when properly configured
Given valid Azure AI Foundry credentials are provided
And the endpoint and API key are set in environment variables
When the LLM provider initializes
Then it should successfully connect to Azure AI Foundry
And it should be ready to process requests

### Scenario: Clarifying chat asks narrowing questions
Given a user submits an ambiguous request
When the clarifying chat processes the request
Then it should identify the ambiguous aspects
And it should ask specific narrowing questions
And it should not ask open-ended exploratory questions

### Scenario: Clarifying chat maintains session context
Given a user has an active chat session
And the user has answered previous clarifying questions
When the user submits a follow-up message
Then the chat should remember previous context
And it should use that context to refine further questions

### Scenario: Clarifying chat degrades gracefully without LLM
Given the LLM provider is in fallback mode
When a user submits a request to the clarifying chat
Then the system should return a helpful error message
And it should explain that LLM features are unavailable
And it should not crash or hang

## Technical Requirements

1. **LLM Provider (`src/llm/azure-foundry-provider.ts`)**:
   - Single-file implementation
   - Pluggable interface compatible with future providers
   - Environment variables: `AZURE_FOUNDRY_ENDPOINT`, `AZURE_FOUNDRY_API_KEY`
   - Graceful degradation when unconfigured
   - Proper error handling and logging

2. **Clarifying Chat (`src/chat/clarifying-chat.ts`)**:
   - Session-based conversation tracking
   - Focus on narrowing/disambiguating questions only
   - Simple in-memory session storage (can be enhanced later)
   - RESTful API endpoints for chat interaction

3. **API Endpoints**:
   - `POST /api/chat/clarify` - Submit a message for clarification
   - `GET /api/chat/session/:sessionId` - Retrieve session context
   - `DELETE /api/chat/session/:sessionId` - Clear session

4. **Graceful Degradation**:
   - Application starts and runs without Azure AI Foundry
   - Clear error messages when LLM features are unavailable
   - No crashes or unhandled promise rejections
