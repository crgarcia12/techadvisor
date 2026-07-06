import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// Serve static files from the built web app
const webDistPath = path.join(__dirname, '../../web/dist');
app.use(express.static(webDistPath));

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'techadvisor-server' });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

// Socket.IO setup with CORS for local development
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Chat events
  socket.on('chat:message', (data) => {
    console.log('Chat message received:', data);
    // Broadcast to all clients including sender
    io.emit('chat:message', {
      ...data,
      timestamp: new Date().toISOString(),
      id: `msg-${Date.now()}-${socket.id.slice(0, 4)}`
    });
  });

  // Comparison table events
  socket.on('table:update', (data) => {
    console.log('Table update received:', data);
    // Broadcast to all clients
    io.emit('table:update', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('table:add-row', (data) => {
    console.log('Table add row:', data);
    io.emit('table:add-row', data);
  });

  socket.on('table:remove-row', (data) => {
    console.log('Table remove row:', data);
    io.emit('table:remove-row', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
