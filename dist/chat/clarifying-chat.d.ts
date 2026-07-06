import { LLMProvider } from '../llm/azure-foundry-provider';
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}
export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class ClarifyingChat {
    private sessions;
    private provider;
    private readonly CLARIFYING_SYSTEM_PROMPT;
    constructor(provider: LLMProvider);
    createSession(): string;
    getSession(sessionId: string): ChatSession | null;
    deleteSession(sessionId: string): boolean;
    clarify(sessionId: string, userMessage: string): Promise<string>;
    cleanupOldSessions(maxAgeMs?: number): number;
}
//# sourceMappingURL=clarifying-chat.d.ts.map