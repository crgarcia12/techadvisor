import { describe, it, expect, afterEach } from "vitest";
import { FoundryProvider } from "../src/llm/foundryProvider.js";

const KEYS = [
  "AZURE_AI_FOUNDRY_ENDPOINT",
  "AZURE_AI_FOUNDRY_DEPLOYMENT",
  "TECHADVISOR_DISABLE_AI",
];
const saved: Record<string, string | undefined> = {};

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function snapshot() {
  for (const k of KEYS) saved[k] = process.env[k];
}

describe("FoundryProvider.isConfigured", () => {
  it("is configured when endpoint and deployment are present", () => {
    snapshot();
    process.env.AZURE_AI_FOUNDRY_ENDPOINT = "https://example.openai.azure.com/";
    process.env.AZURE_AI_FOUNDRY_DEPLOYMENT = "gpt-4o-mini";
    delete process.env.TECHADVISOR_DISABLE_AI;
    expect(new FoundryProvider().isConfigured()).toBe(true);
  });

  it("reports unconfigured when TECHADVISOR_DISABLE_AI is set, even with creds", () => {
    snapshot();
    process.env.AZURE_AI_FOUNDRY_ENDPOINT = "https://example.openai.azure.com/";
    process.env.AZURE_AI_FOUNDRY_DEPLOYMENT = "gpt-4o-mini";
    process.env.TECHADVISOR_DISABLE_AI = "true";
    expect(new FoundryProvider().isConfigured()).toBe(false);
  });

  it("is unconfigured when endpoint/deployment are absent", () => {
    snapshot();
    delete process.env.AZURE_AI_FOUNDRY_ENDPOINT;
    delete process.env.AZURE_AI_FOUNDRY_DEPLOYMENT;
    delete process.env.TECHADVISOR_DISABLE_AI;
    expect(new FoundryProvider().isConfigured()).toBe(false);
  });
});
