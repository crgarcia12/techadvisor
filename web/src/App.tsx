import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  addProduct,
  connectSocket,
  fetchConfig,
  sendChat,
  type ChatMessage,
  type MetricPair,
  type Product,
} from "./api.js";
import { ChatPane } from "./ChatPane.js";
import { ComparisonTable } from "./ComparisonTable.js";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm TechAdvisor. Tell me what you're shopping for (e.g. \"I want a TV\") and I'll help you narrow it down. When you find candidates online, paste their URLs and prices and I'll compare the real specs.",
    },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  // metricName list still being researched, per product id
  const [researching, setResearching] = useState<Record<string, string[]>>({});
  const [configMissing, setConfigMissing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchConfig()
      .then((c) => setConfigMissing(!c.llmConfigured))
      .catch(() => void 0);

    const socket = connectSocket();
    socketRef.current = socket;

    socket.on("product:added", ({ product, researchingKeys }: { product: Product; researchingKeys: string[] }) => {
      setProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
      setResearching((prev) => ({ ...prev, [product.id]: researchingKeys }));
    });

    socket.on("product:title", ({ id, title }: { id: string; title: string }) => {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
    });

    socket.on(
      "metric:update",
      ({ id, metric, status }: { id: string; metric: MetricPair | { name: string }; status: string }) => {
        if (status === "resolved") {
          const m = metric as MetricPair;
          setProducts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, metrics: { ...p.metrics, [m.name]: m } } : p)),
          );
        }
        setResearching((prev) => ({
          ...prev,
          [id]: (prev[id] ?? []).filter((name) => name !== metric.name),
        }));
      },
    );

    socket.on("product:error", ({ id, error }: { id: string; error: string }) => {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "error", error } : p)));
      setResearching((prev) => ({ ...prev, [id]: [] }));
    });

    socket.on("product:done", ({ product }: { product: Product }) => {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...product } : p)));
      setResearching((prev) => ({ ...prev, [product.id]: [] }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const isResearching = useMemo(
    () => Object.fromEntries(Object.entries(researching).map(([id, list]) => [id, new Set(list)])),
    [researching],
  );

  async function handleSend(text: string) {
    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextHistory);
    try {
      const { reply, configMissing: cm } = await sendChat(
        nextHistory.filter((m) => m.role !== "assistant" || true),
      );
      if (cm) setConfigMissing(true);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I couldn't reach the chat service: ${(err as Error).message}` },
      ]);
    }
  }

  async function handleAddProduct(url: string, price: string) {
    try {
      await addProduct(url, price);
      // The product will arrive via the product:added socket event.
    } catch (err) {
      alert(`Could not add product: ${(err as Error).message}`);
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__logo">🔎 TechAdvisor</span>
        <span className="app__tagline">Compare products using real, web-crawled specs</span>
      </header>
      <main className="app__main">
        <section className="pane pane--chat" data-testid="chat-pane">
          <ChatPane
            messages={messages}
            configMissing={configMissing}
            onSend={handleSend}
            onAddProduct={handleAddProduct}
          />
        </section>
        <section className="pane pane--table" data-testid="table-pane">
          <ComparisonTable products={products} researching={isResearching} />
        </section>
      </main>
    </div>
  );
}
