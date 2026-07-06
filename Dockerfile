# Use Microsoft Azure Linux base image for Node.js (avoids Docker Hub rate limits)
FROM mcr.microsoft.com/azurelinux/base/nodejs:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM mcr.microsoft.com/azurelinux/base/nodejs:20

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy public static files
COPY public ./public

# Expose port (the actual port is set via $PORT environment variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
# Server binds to 0.0.0.0:$PORT per Liliput contract
CMD ["node", "dist/server.js"]
