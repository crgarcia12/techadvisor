import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { Server } from "socket.io";
import { runChat } from "./chat.js";
import { createProduct, researchProduct, products } from "./research.js";
import { getLlmProvider } from "./llm/index.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
/**
 * Base path for browser-facing URLs. Behind Liliput's path-stripping proxy the
 * browser must request the prefixed path; the proxy strips it before we see it,
 * so we still mount routes at "/". This value is only echoed to the client so it
 * can build correctly-prefixed socket/API URLs. Defaults to empty (local dev).
 */
const BASE_PATH = process.env.BASE_PATH ?? "";
const app = express();
app.use(cors());
app.use(express.json());
const httpServer = createServer(app);
// Socket.IO stays at the default "/socket.io" path — the proxy strips the
// prefix so the server always sees the root path.
const io = new Server(httpServer, { cors: { origin: "*" } });
app.get("/api/health", (_req, res) => {
    const provider = getLlmProvider();
    res.json({
        ok: true,
        llm: { name: provider.name, configured: provider.isConfigured() },
        basePath: BASE_PATH,
    });
});
// Client config (lets the SPA discover whether the LLM is configured).
app.get("/api/config", (_req, res) => {
    const provider = getLlmProvider();
    res.json({ llmConfigured: provider.isConfigured(), llmProvider: provider.name });
});
app.post("/api/chat", async (req, res) => {
    const history = (req.body?.messages ?? []);
    if (!Array.isArray(history)) {
        res.status(400).json({ error: "messages must be an array" });
        return;
    }
    try {
        const result = await runChat(history);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get("/api/products", (_req, res) => {
    res.json({ products: [...products.values()] });
});
app.post("/api/products", (req, res) => {
    const { url, price } = req.body ?? {};
    if (typeof url !== "string" || !url.trim()) {
        res.status(400).json({ error: "url is required" });
        return;
    }
    const product = createProduct(url.trim(), String(price ?? "").trim());
    res.status(201).json({ product });
    // Kick off research asynchronously; a failure here never crashes the session.
    researchProduct(io, product).catch((err) => {
        console.error(JSON.stringify({ level: "error", msg: "research failed", id: product.id, err: String(err) }));
    });
});
// --- Static frontend (production build) -------------------------------------
const webDist = join(__dirname, "..", "..", "web", "dist");
if (existsSync(webDist)) {
    app.use(express.static(webDist));
    // SPA fallback for non-API GET routes. No redirects (see deploy contract #3).
    app.get(/^(?!\/api\/|\/socket\.io\/).*/, (_req, res) => {
        res.sendFile(join(webDist, "index.html"));
    });
}
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(JSON.stringify({ level: "info", msg: "TechAdvisor server listening", port: PORT, basePath: BASE_PATH }));
});
