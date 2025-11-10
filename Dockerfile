# Use Node.js 22.12 or later
FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Angular app
RUN npm run build:prod

# Production stage - only proxy server
FROM node:22.12-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy proxy server
COPY proxy-server.js ./

# Copy built Angular app (optional, if you want to serve it from proxy)
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start proxy server
CMD ["node", "proxy-server.js"]

