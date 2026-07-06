import { AzureOpenAI } from 'openai';

export interface LLMProvider {
  isConfigured(): boolean;
  isAvailable(): boolean;
  generate(prompt: string, context?: string[]): Promise<string>;
}

export class AzureFoundryProvider implements LLMProvider {
  private client: AzureOpenAI | null = null;
  private endpoint: string | undefined;
  private apiKey: string | undefined;
  private deploymentId: string;
  private configured: boolean = false;

  constructor() {
    this.endpoint = process.env.AZURE_FOUNDRY_ENDPOINT;
    this.apiKey = process.env.AZURE_FOUNDRY_API_KEY;
    this.deploymentId = process.env.AZURE_FOUNDRY_DEPLOYMENT_ID || 'gpt-4';

    if (this.endpoint && this.apiKey) {
      try {
        this.client = new AzureOpenAI({
          endpoint: this.endpoint,
          apiKey: this.apiKey,
          apiVersion: '2024-10-21',
        });
        this.configured = true;
      } catch (error) {
        console.error('Failed to initialize Azure AI Foundry client:', error);
        this.configured = false;
      }
    } else {
      console.warn(
        'Azure AI Foundry credentials not configured. ' +
        'Set AZURE_FOUNDRY_ENDPOINT and AZURE_FOUNDRY_API_KEY environment variables. ' +
        'Application will run in fallback mode without LLM capabilities.'
      );
      this.configured = false;
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  isAvailable(): boolean {
    return this.configured && this.client !== null;
  }

  async generate(prompt: string, context?: string[]): Promise<string> {
    if (!this.isAvailable() || !this.client) {
      throw new Error(
        'LLM provider is not configured. Please set AZURE_FOUNDRY_ENDPOINT and AZURE_FOUNDRY_API_KEY.'
      );
    }

    try {
      const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
      
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
    } catch (error) {
      console.error('Error generating response from Azure AI Foundry:', error);
      throw error;
    }
  }
}
