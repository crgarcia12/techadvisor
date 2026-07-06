export interface LLMProvider {
    isConfigured(): boolean;
    isAvailable(): boolean;
    generate(prompt: string, context?: string[]): Promise<string>;
}
export declare class AzureFoundryProvider implements LLMProvider {
    private client;
    private endpoint;
    private apiKey;
    private deploymentId;
    private configured;
    constructor();
    isConfigured(): boolean;
    isAvailable(): boolean;
    generate(prompt: string, context?: string[]): Promise<string>;
}
//# sourceMappingURL=azure-foundry-provider.d.ts.map