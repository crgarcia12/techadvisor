"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureFoundryProvider = void 0;
const openai_1 = require("@azure/openai");
class AzureFoundryProvider {
    constructor() {
        this.client = null;
        this.configured = false;
        this.endpoint = process.env.AZURE_FOUNDRY_ENDPOINT;
        this.apiKey = process.env.AZURE_FOUNDRY_API_KEY;
        if (this.endpoint && this.apiKey) {
            try {
                this.client = new openai_1.OpenAIClient(this.endpoint, new openai_1.AzureKeyCredential(this.apiKey));
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
            const deploymentId = process.env.AZURE_FOUNDRY_DEPLOYMENT_ID || 'gpt-4';
            const result = await this.client.getChatCompletions(deploymentId, messages);
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