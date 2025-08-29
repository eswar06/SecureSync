# Multi-stage build for SecureSync Pro Backend

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build backend
WORKDIR /app/packages/backend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S securesync -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=securesync:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=securesync:nodejs /app/packages/backend/package*.json ./
COPY --from=builder --chown=securesync:nodejs /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads && chown -R securesync:nodejs /app

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Security: Remove package managers and unnecessary tools
RUN apk del --no-cache npm

# Switch to non-root user
USER securesync

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 5000, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
      process.exit(res.statusCode === 200 ? 0 : 1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start application
CMD ["node", "dist/index.js"]
