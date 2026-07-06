import { AzureFoundryProvider } from '../azure-foundry-provider';

describe('AzureFoundryProvider', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Graceful Degradation', () => {
    test('should initialize in fallback mode when credentials are not provided', () => {
      delete process.env.AZURE_FOUNDRY_ENDPOINT;
      delete process.env.AZURE_FOUNDRY_API_KEY;

      const provider = new AzureFoundryProvider();
      
      expect(provider.isConfigured()).toBe(false);
      expect(provider.isAvailable()).toBe(false);
    });

    test('should log warning when credentials are missing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      delete process.env.AZURE_FOUNDRY_ENDPOINT;
      delete process.env.AZURE_FOUNDRY_API_KEY;

      new AzureFoundryProvider();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Azure AI Foundry credentials not configured')
      );
      
      consoleSpy.mockRestore();
    });

    test('should not crash when calling generate without configuration', async () => {
      delete process.env.AZURE_FOUNDRY_ENDPOINT;
      delete process.env.AZURE_FOUNDRY_API_KEY;

      const provider = new AzureFoundryProvider();
      
      await expect(provider.generate('test prompt')).rejects.toThrow(
        'LLM provider is not configured'
      );
    });
  });

  describe('Proper Configuration', () => {
    test('should initialize successfully with valid credentials', () => {
      process.env.AZURE_FOUNDRY_ENDPOINT = 'https://test.openai.azure.com';
      process.env.AZURE_FOUNDRY_API_KEY = 'test-api-key';

      const provider = new AzureFoundryProvider();

      expect(provider.isConfigured()).toBe(true);
      expect(provider.isAvailable()).toBe(true);
    });

    test('should require both endpoint and API key', () => {
      process.env.AZURE_FOUNDRY_ENDPOINT = 'https://test.openai.azure.com';
      delete process.env.AZURE_FOUNDRY_API_KEY;

      const provider = new AzureFoundryProvider();

      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      process.env.AZURE_FOUNDRY_ENDPOINT = 'https://invalid.endpoint.test';
      process.env.AZURE_FOUNDRY_API_KEY = 'test-key';

      const provider = new AzureFoundryProvider();

      await expect(provider.generate('test')).rejects.toThrow();
    });
  });
});
