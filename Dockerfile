# Use Microsoft Container Registry base image to avoid Docker Hub rate limits
FROM mcr.microsoft.com/azurelinux/base/nodejs:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only for deployment)
RUN npm ci --omit=dev

# Copy application source
COPY src/ ./src/

# Expose the port (will be overridden by Liliput's PORT env var)
EXPOSE 3000

# Set NODE_ENV
ENV NODE_ENV=production

# Run the server (binds to 0.0.0.0:$PORT)
CMD ["node", "src/server.js"]
