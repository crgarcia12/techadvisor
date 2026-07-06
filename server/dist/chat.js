import { getLlmProvider } from "./llm/index.js";
const SYSTEM_PROMPT = {
    role: "system",
    content: "You are TechAdvisor, an assistant that helps a user decide which technology product to buy " +
        "(e.g. a TV). Your ONLY job is to ask short clarifying questions that narrow down the product " +
        "category and the buyer's constraints — screen size in inches, budget, room, intended use, " +
        "preferred features. Ask ONE focused question at a time. You MUST NOT state or invent any " +
        "product specification values (no resolutions, contrast ratios, model claims); real specs come " +
        "from crawling the pages the user pastes. Keep replies to 1-2 sentences.",
};
/** Deterministic fallback used when Azure AI Foundry is not configured. It still
 *  asks genuine narrowing questions so the app is useful offline. */
function ruleBasedReply(history) {
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content.toLowerCase() ?? "";
    const asked = history.filter((m) => m.role === "assistant").length;
    const mentions = (words) => words.some((w) => lastUser.includes(w));
    if (mentions(["tv", "television", "screen"]) || asked === 0) {
        if (!/\b(\d{2,3})\s*("|inch|inches|in\b)/.test(lastUser)) {
            return "Great — let's find you a TV. What screen size (in inches) are you looking for?";
        }
    }
    const questions = [
        "What's your budget range for this purchase?",
        "Where will it be used — a bright living room or a darker home-theatre space?",
        "Any must-have features (e.g. 120 Hz for gaming, Dolby Vision HDR, a specific smart platform)?",
        "Once you've found some candidates online, paste their URLs and the price you saw and I'll compare the real specs for you.",
    ];
    return questions[Math.min(asked - 1, questions.length - 1)] ?? questions[questions.length - 1];
}
const CONFIG_MISSING_NOTE = "⚠️ Azure AI Foundry is not configured, so I'm using a built-in guided flow. " +
    "Set AZURE_AI_FOUNDRY_ENDPOINT, AZURE_AI_FOUNDRY_DEPLOYMENT and credentials to enable the full AI chat.";
export async function runChat(history) {
    const provider = getLlmProvider();
    if (!provider.isConfigured()) {
        return { reply: `${ruleBasedReply(history)}\n\n${CONFIG_MISSING_NOTE}`, configMissing: true };
    }
    try {
        const reply = await provider.chat([SYSTEM_PROMPT, ...history]);
        return { reply: reply || ruleBasedReply(history), configMissing: false };
    }
    catch (err) {
        return {
            reply: `${ruleBasedReply(history)}\n\n(Note: the AI provider returned an error: ${err.message})`,
            configMissing: false,
        };
    }
}
