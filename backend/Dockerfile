FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application source
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
