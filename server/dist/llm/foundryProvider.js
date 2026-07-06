import { DefaultAzureCredential } from "@azure/identity";
/**
 * Azure AI Foundry provider.
 *
 * Configuration (all via environment variables):
 *   AZURE_AI_FOUNDRY_ENDPOINT   e.g. https://my-resource.openai.azure.com
 *   AZURE_AI_FOUNDRY_DEPLOYMENT e.g. gpt-4o-mini
 *   AZURE_AI_FOUNDRY_API_VERSION (optional, defaults to 2024-08-01-preview)
 *   Auth (pick one):
 *     AZURE_AI_FOUNDRY_API_KEY  — key-based auth, OR
 *     (nothing)                 — Entra ID via DefaultAzureCredential
 *
 * When the endpoint/deployment are absent, `isConfigured()` returns false and
 * the app falls back to a deterministic rule-based responder (see chat.ts).
 */
const SCOPE = "https://cognitiveservices.azure.com/.default";
export class FoundryProvider {
    name = "azure-ai-foundry";
    endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT?.replace(/\/$/, "") ?? "";
    deployment = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT ?? "";
    apiVersion = process.env.AZURE_AI_FOUNDRY_API_VERSION ?? "2024-08-01-preview";
    apiKey = process.env.AZURE_AI_FOUNDRY_API_KEY ?? "";
    isConfigured() {
        return Boolean(this.endpoint && this.deployment);
    }
    async authHeaders() {
        if (this.apiKey) {
            return { "api-key": this.apiKey };
        }
        const credential = new DefaultAzureCredential();
        const token = await credential.getToken(SCOPE);
        return { Authorization: `Bearer ${token.token}` };
    }
    async complete(messages, temperature) {
        const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20_000);
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(await this.authHeaders()) },
                body: JSON.stringify({ messages, temperature, max_tokens: 500 }),
                signal: controller.signal,
            });
            if (!res.ok) {
                throw new Error(`Foundry request failed: ${res.status} ${res.statusText}`);
            }
            const data = (await res.json());
            return data.choices?.[0]?.message?.content?.trim() ?? "";
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async chat(messages) {
        return this.complete(messages, 0.3);
    }
    /**
     * Refine crawled metric candidates. The LLM is instructed to ONLY reformat
     * values already present in the raw text. As a hard guard we additionally
     * discard any returned pair whose value cannot be located in `rawText`.
     */
    async extractMetrics(rawText, candidates) {
        if (candidates.length === 0)
            return [];
        const system = {
            role: "system",
            content: "You normalise product specification text. You are given RAW_TEXT and CANDIDATES " +
                "(name/value/sourceSnippet triples parsed from that text). Return a JSON array of " +
                "{name,value,sourceSnippet}. You may clean up formatting of names/values but you MUST " +
                "NOT introduce any value that does not literally appear in RAW_TEXT. Never guess or use " +
                "outside knowledge. If unsure, drop the item.",
        };
        const user = {
            role: "user",
            content: `RAW_TEXT:\n${rawText.slice(0, 6000)}\n\nCANDIDATES:\n${JSON.stringify(candidates)}`,
        };
        try {
            const raw = await this.complete([system, user], 0);
            const json = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
            const parsed = JSON.parse(json);
            const haystack = rawText.toLowerCase();
            return parsed.filter((p) => p &&
                p.name &&
                p.value &&
                p.sourceSnippet &&
                haystack.includes(String(p.value).toLowerCase().slice(0, 24)));
        }
        catch {
            // On any failure, fall back to the deterministic candidates untouched.
            return candidates;
        }
    }
}
