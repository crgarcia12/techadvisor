import { useState, useEffect, useRef } from 'react';
import './ChatPane.css';

function ChatPane({ socket }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState(`User${Math.floor(Math.random() * 1000)}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    function onChatMessage(data) {
      setMessages(prev => [...prev, data]);
    }

    socket.on('chat:message', onChatMessage);

    return () => {
      socket.off('chat:message', onChatMessage);
    };
  }, [socket]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      socket.emit('chat:message', {
        username,
        message: inputValue.trim()
      });
      setInputValue('');
    }
  };

  return (
    <div className="chat-pane">
      <div className="pane-header">
        <h2>Chat</h2>
        <input
          type="text"
          className="username-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name"
        />
      </div>
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">No messages yet. Start a conversation!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="message">
              <div className="message-header">
                <span className="message-username">{msg.username}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-body">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatPane;
