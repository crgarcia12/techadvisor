"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClarifyingChat = void 0;
const uuid_1 = require("uuid");
class ClarifyingChat {
    constructor(provider) {
        this.sessions = new Map();
        this.CLARIFYING_SYSTEM_PROMPT = `You are a clarifying assistant. Your sole purpose is to ask NARROWING questions to disambiguate user requests.

Rules:
1. Ask ONLY specific, narrowing questions - never open-ended exploratory questions
2. Each question should eliminate possible interpretations or narrow the scope
3. Focus on missing details that prevent understanding the request
4. Be concise - one focused question at a time
5. Use previous context to avoid repeating questions

Examples of GOOD narrowing questions:
- "Are you referring to the production or staging environment?"
- "Do you need this for Node.js or Python?"
- "Should this run on a schedule or be triggered manually?"

Examples of BAD open-ended questions:
- "What are you trying to achieve?" (too broad)
- "Tell me more about your project" (exploratory)
- "What features do you want?" (open-ended)

Given the user's message and conversation history, generate ONE specific narrowing question.`;
        this.provider = provider;
    }
    createSession() {
        const sessionId = (0, uuid_1.v4)();
        const session = {
            id: sessionId,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.sessions.set(sessionId, session);
        return sessionId;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    async clarify(sessionId, userMessage) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        if (!this.provider.isAvailable()) {
            return 'LLM features are currently unavailable. Please configure Azure AI Foundry credentials (AZURE_FOUNDRY_ENDPOINT and AZURE_FOUNDRY_API_KEY) to enable clarifying chat.';
        }
        // Add user message to session
        session.messages.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        });
        session.updatedAt = new Date();
        try {
            // Build context from previous messages
            const context = [];
            for (const msg of session.messages.slice(0, -1)) {
                context.push(msg.content);
            }
            // Generate narrowing question
            const prompt = `${this.CLARIFYING_SYSTEM_PROMPT}\n\nUser message: "${userMessage}"\n\nGenerate ONE specific narrowing question:`;
            const response = await this.provider.generate(prompt, context);
            // Add assistant response to session
            session.messages.push({
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            });
            session.updatedAt = new Date();
            return response;
        }
        catch (error) {
            console.error('Error in clarifying chat:', error);
            throw error;
        }
    }
    // Cleanup old sessions (can be called periodically)
    cleanupOldSessions(maxAgeMs = 3600000) {
        const now = Date.now();
        let deletedCount = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.updatedAt.getTime() > maxAgeMs) {
                this.sessions.delete(sessionId);
                deletedCount++;
            }
        }
        return deletedCount;
    }
}
exports.ClarifyingChat = ClarifyingChat;
//# sourceMappingURL=clarifying-chat.js.map