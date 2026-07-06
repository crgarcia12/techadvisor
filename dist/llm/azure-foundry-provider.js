"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureFoundryProvider = void 0;
const openai_1 = require("openai");
class AzureFoundryProvider {
    constructor() {
        this.client = null;
        this.configured = false;
        this.endpoint = process.env.AZURE_FOUNDRY_ENDPOINT;
        this.apiKey = process.env.AZURE_FOUNDRY_API_KEY;
        this.deploymentId = process.env.AZURE_FOUNDRY_DEPLOYMENT_ID || 'gpt-4';
        if (this.endpoint && this.apiKey) {
            try {
                this.client = new openai_1.AzureOpenAI({
                    endpoint: this.endpoint,
                    apiKey: this.apiKey,
                    apiVersion: '2024-10-21',
                });
                this.configured = true;
            }
            catch (error) {
                console.error('Failed to initialize Azure AI Foundry client:', error);
                this.configured = false;
            }
        }
        else {
            console.warn('Azure AI Foundry credentials not configured. ' +
                'Set AZURE_FOUNDRY_ENDPOINT and AZURE_FOUNDRY_API_KEY environment variables. ' +
                'Application will run in fallback mode without LLM capabilities.');
            this.configured = false;
        }
    }
    isConfigured() {
        return this.configured;
    }
    isAvailable() {
        return this.configured && this.client !== null;
    }
    async generate(prompt, context) {
        if (!this.isAvailable() || !this.client) {
            throw new Error('LLM provider is not configured. Please set AZURE_FOUNDRY_ENDPOINT and AZURE_FOUNDRY_API_KEY.');
        }
        try {
            const messages = [];
            if (context && context.length > 0) {
                context.forEach((ctx, idx) => {
                    const role = idx % 2 === 0 ? 'user' : 'assistant';
                    messages.push({ role, content: ctx });
                });
            }
            messages.push({ role: 'user', content: prompt });
            const result = await this.client.chat.completions.create({
                model: this.deploymentId,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
            });
            const choice = result.choices[0];
            if (!choice || !choice.message) {
                throw new Error('No response from Azure AI Foundry');
            }
            return choice.message.content || '';
        }
        catch (error) {
            console.error('Error generating response from Azure AI Foundry:', error);
            throw error;
        }
    }
}
exports.AzureFoundryProvider = AzureFoundryProvider;
//# sourceMappingURL=azure-foundry-provider.js.map