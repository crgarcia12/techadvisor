"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const azure_foundry_provider_1 = require("./llm/azure-foundry-provider");
const clarifying_chat_1 = require("./chat/clarifying-chat");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Initialize LLM provider and chat
const llmProvider = new azure_foundry_provider_1.AzureFoundryProvider();
const clarifyingChat = new clarifying_chat_1.ClarifyingChat(llmProvider);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        llmConfigured: llmProvider.isConfigured(),
        timestamp: new Date().toISOString(),
    });
});
// Create a new chat session
app.post('/api/chat/session', (req, res) => {
    try {
        const sessionId = clarifyingChat.createSession();
        res.json({ sessionId });
    }
    catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});
// Get session details
app.get('/api/chat/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = clarifyingChat.getSession(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    }
    catch (error) {
        console.error('Error retrieving session:', error);
        res.status(500).json({ error: 'Failed to retrieve session' });
    }
});
// Delete a session
app.delete('/api/chat/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const deleted = clarifyingChat.deleteSession(sessionId);
        if (!deleted) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});
// Send a message for clarification
app.post('/api/chat/clarify', async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        if (!sessionId || !message) {
            return res.status(400).json({ error: 'sessionId and message are required' });
        }
        const response = await clarifyingChat.clarify(sessionId, message);
        res.json({ response });
    }
    catch (error) {
        console.error('Error in clarify endpoint:', error);
        if (error.message === 'Session not found') {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.status(500).json({ error: error.message || 'Failed to process clarification' });
    }
});
// Cleanup old sessions every hour
setInterval(() => {
    const deleted = clarifyingChat.cleanupOldSessions();
    if (deleted > 0) {
        console.log(`Cleaned up ${deleted} old sessions`);
    }
}, 3600000);
// Start server - bind to 0.0.0.0 per Liliput contract
const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
app.listen(portNum, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
    console.log(`LLM Provider configured: ${llmProvider.isConfigured()}`);
    if (!llmProvider.isConfigured()) {
        console.log('💡 To enable LLM features, set these environment variables:');
        console.log('   - AZURE_FOUNDRY_ENDPOINT');
        console.log('   - AZURE_FOUNDRY_API_KEY');
        console.log('   - AZURE_FOUNDRY_DEPLOYMENT_ID (optional, defaults to gpt-4)');
    }
});
exports.default = app;
//# sourceMappingURL=server.js.map