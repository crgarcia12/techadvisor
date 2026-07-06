# Use Microsoft Container Registry base image (not Docker Hub)
FROM mcr.microsoft.com/azurelinux/base/nodejs:20

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
COPY packages/web/package*.json ./packages/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/server ./packages/server
COPY packages/web ./packages/web

# Build the web app with Liliput base path
ENV BASE_PATH=/dev/crgarcia12/techadvisor/liliput-task-8f6ccca6
RUN npm run build:web

# Expose port (will be provided by Liliput as $PORT env var)
EXPOSE 3001

# Start the server (binds to 0.0.0.0:$PORT per Liliput contract)
CMD ["npm", "start"]
