import { ClarifyingChat } from './clarifying-chat';
import { AzureFoundryProvider } from '../llm/azure-foundry-provider';

jest.mock('../llm/azure-foundry-provider');

describe('ClarifyingChat', () => {
  let chat: ClarifyingChat;
  let mockProvider: jest.Mocked<AzureFoundryProvider>;

  beforeEach(() => {
    mockProvider = new AzureFoundryProvider() as jest.Mocked<AzureFoundryProvider>;
    chat = new ClarifyingChat(mockProvider);
  });

  describe('Session Management', () => {
    test('should create a new session', () => {
      const sessionId = chat.createSession();
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
    });

    test('should retrieve session context', () => {
      const sessionId = chat.createSession();
      const session = chat.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.id).toBe(sessionId);
      expect(session?.messages).toEqual([]);
    });

    test('should return null for non-existent session', () => {
      const session = chat.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    test('should delete session', () => {
      const sessionId = chat.createSession();
      
      expect(chat.deleteSession(sessionId)).toBe(true);
      expect(chat.getSession(sessionId)).toBeNull();
    });
  });

  describe('Context Maintenance', () => {
    test('should remember previous messages in session', async () => {
      mockProvider.isAvailable.mockReturnValue(true);
      mockProvider.generate.mockResolvedValue('What specifically do you need help with?');

      const sessionId = chat.createSession();
      
      await chat.clarify(sessionId, 'I need help with my project');
      const session = chat.getSession(sessionId);

      expect(session?.messages.length).toBeGreaterThan(0);
      expect(session?.messages[0].content).toBe('I need help with my project');
    });

    test('should use previous context for follow-up questions', async () => {
      mockProvider.isAvailable.mockReturnValue(true);
      mockProvider.generate
        .mockResolvedValueOnce('What type of project?')
        .mockResolvedValueOnce('Which framework are you using?');

      const sessionId = chat.createSession();
      
      await chat.clarify(sessionId, 'I need help');
      await chat.clarify(sessionId, 'A web project');

      const session = chat.getSession(sessionId);
      expect(session?.messages.length).toBe(4); // 2 user + 2 assistant messages
    });
  });

  describe('Graceful Degradation', () => {
    test('should return error message when LLM is unavailable', async () => {
      mockProvider.isAvailable.mockReturnValue(false);

      const sessionId = chat.createSession();
      const result = await chat.clarify(sessionId, 'test message');

      expect(result).toContain('LLM features are currently unavailable');
    });

    test('should not crash when LLM provider fails', async () => {
      mockProvider.isAvailable.mockReturnValue(true);
      mockProvider.generate.mockRejectedValue(new Error('Network error'));

      const sessionId = chat.createSession();
      
      await expect(chat.clarify(sessionId, 'test')).rejects.toThrow('Network error');
    });

    test('should handle invalid session gracefully', async () => {
      await expect(chat.clarify('invalid-id', 'test')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('Narrowing Questions', () => {
    test('should ask specific narrowing questions', async () => {
      mockProvider.isAvailable.mockReturnValue(true);
      mockProvider.generate.mockResolvedValue('What programming language are you using?');

      const sessionId = chat.createSession();
      const response = await chat.clarify(sessionId, 'I have a bug');

      // The response should be a specific question, not open-ended
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
      // Check that the generate method was called with a prompt containing NARROWING
      const callArgs = mockProvider.generate.mock.calls[0];
      expect(callArgs[0]).toContain('NARROWING');
    });
  });
});
