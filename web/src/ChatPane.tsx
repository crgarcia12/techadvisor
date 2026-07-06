import { useState } from "react";
import type { ChatMessage } from "./api.js";

interface Props {
  messages: ChatMessage[];
  configMissing: boolean;
  onSend: (text: string) => void;
  onAddProduct: (url: string, price: string) => void;
}

export function ChatPane({ messages, configMissing, onSend, onAddProduct }: Props) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");

  function submitChat(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  }

  function submitProduct(e: React.FormEvent) {
    e.preventDefault();
    const u = url.trim();
    if (!u) return;
    onAddProduct(u, price.trim());
    setUrl("");
    setPrice("");
  }

  return (
    <div className="chat">
      <h2 className="pane__title">Chat</h2>

      {configMissing && (
        <div className="chat__notice" data-testid="config-missing" role="alert">
          ⚠️ Azure AI Foundry is not configured. The assistant is running a built-in guided flow.
          Set <code>AZURE_AI_FOUNDRY_ENDPOINT</code>, <code>AZURE_AI_FOUNDRY_DEPLOYMENT</code> and
          credentials (see README) to enable full AI chat.
        </div>
      )}

      <div className="chat__messages" data-testid="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.role}`} data-role={m.role}>
            {m.content}
          </div>
        ))}
      </div>

      <form className="chat__input" onSubmit={submitChat}>
        <input
          type="text"
          placeholder='e.g. "I want a TV"'
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid="chat-input"
          aria-label="Chat message"
        />
        <button type="submit" data-testid="chat-send">
          Send
        </button>
      </form>

      <form className="product-form" onSubmit={submitProduct} data-testid="product-form">
        <h3 className="product-form__title">Add a product to compare</h3>
        <input
          type="url"
          placeholder="Product page URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          data-testid="product-url"
          aria-label="Product URL"
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="Price you found"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          data-testid="product-price"
          aria-label="Product price"
        />
        <button type="submit" data-testid="product-add">
          Add &amp; research
        </button>
      </form>
    </div>
  );
}
