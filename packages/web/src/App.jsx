import { useState, useEffect } from 'react';
import socket from './socket';
import './App.css';
import ChatPane from './components/ChatPane';
import ComparisonTablePane from './components/ComparisonTablePane';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>TechAdvisor</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </div>
      </header>
      <div className="app-content">
        <ChatPane socket={socket} />
        <ComparisonTablePane socket={socket} />
      </div>
    </div>
  );
}

export default App;
