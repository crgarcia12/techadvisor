# Use Microsoft Container Registry base image (not Docker Hub - avoid rate limits)
FROM mcr.microsoft.com/azurelinux/base/nodejs:20 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build with Liliput base path
RUN npm run build

# Production stage
FROM mcr.microsoft.com/azurelinux/base/nodejs:20

WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/dist ./dist

# The port is provided by Liliput via $PORT env var
ENV PORT=8080
EXPOSE 8080

# Serve the app
# Key points per Liliput contract:
# 1. Bind to 0.0.0.0 (not 127.0.0.1) so the Service can reach it
# 2. Serve from / (nginx already stripped the prefix)
# 3. Assets are already prefixed in the build output (vite.config base path)
CMD serve -s dist -l tcp://0.0.0.0:${PORT} --no-port-switching
