import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

export interface LLMProvider {
  isConfigured(): boolean;
  isAvailable(): boolean;
  generate(prompt: string, context?: string[]): Promise<string>;
}

export class AzureFoundryProvider implements LLMProvider {
  private client: OpenAIClient | null = null;
  private endpoint: string | undefined;
  private apiKey: string | undefined;
  private configured: boolean = false;

  constructor() {
    this.endpoint = process.env.AZURE_FOUNDRY_ENDPOINT;
    this.apiKey = process.env.AZURE_FOUNDRY_API_KEY;

    if (this.endpoint && this.apiKey) {
      try {
        this.client = new OpenAIClient(
          this.endpoint,
          new AzureKeyCredential(this.apiKey)
        );
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
      const messages: Array<{ role: string; content: string }> = [];
      
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
    } catch (error) {
      console.error('Error generating response from Azure AI Foundry:', error);
      throw error;
    }
  }
}
