# TechAdvisor

A real-time comparison and chat application built with Express.js, Socket.IO, React, and Vite in a monorepo structure.

## Features

- **Real-time Chat**: Multi-user chat with Socket.IO
- **Comparison Table**: Live collaborative data comparison table
- **Monorepo Structure**: Server and web packages managed with npm workspaces

## Project Structure

```
techadvisor/
├── packages/
│   ├── server/          # Express + Socket.IO backend
│   │   └── src/
│   │       └── index.js
│   └── web/             # React + Vite frontend
│       └── src/
│           ├── App.jsx
│           ├── socket.js
│           └── components/
│               ├── ChatPane.jsx
│               └── ComparisonTablePane.jsx
├── package.json         # Root workspace config
└── Dockerfile          # Production deployment
```

## Development

### Prerequisites
- Node.js 20+
- npm 10+

### Setup

```bash
# Install all dependencies
npm install

# Start both server and web in development mode
npm run dev

# Or start them separately:
npm run dev:server  # Server on port 3001
npm run dev:web     # Web on port 3000
```

### Production Build

```bash
# Build the web app
npm run build:web

# Start the production server
npm start
```

## Socket.IO Events

### Chat Events
- `chat:message` - Send/receive chat messages
  - Emits: `{ username, message }`
  - Receives: `{ username, message, timestamp, id }`

### Table Events
- `table:update` - Update a table row
  - Emits: `{ id, updates }`
  - Receives: `{ id, updates, timestamp }`
- `table:add-row` - Add a new row
  - Emits: `{ id, name, score, status }`
  - Receives: `{ id, name, score, status }`
- `table:remove-row` - Remove a row
  - Emits: `{ id }`
  - Receives: `{ id }`

## Deployment

The application is containerized and follows the Liliput deployment contract. See `LILIPUT_DEPLOY_CONTRACT.md` for details.

```bash
# Build Docker image
docker build -t techadvisor .

# Run container
docker run -p 3001:3001 -e PORT=3001 techadvisor
```
