FROM mcr.microsoft.com/azurelinux/base/nodejs:20

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 8080

CMD ["node", "src/index.js"]
