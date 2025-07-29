# Multi-stage Dockerfile for Authentication Service
# Dockerfile multi-estágio para o Serviço de Autenticação

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY packages/auth-service/package*.json ./packages/auth-service/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/auth-service/ ./packages/auth-service/

# Build shared library
WORKDIR /app/packages/shared
RUN npm run build

# Build auth service
WORKDIR /app/packages/auth-service
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S authservice -u 1001

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Copy built application
COPY --from=builder --chown=authservice:nodejs /app/packages/auth-service/dist ./dist
COPY --from=builder --chown=authservice:nodejs /app/packages/shared/dist ./node_modules/@adms/shared/dist
COPY --from=builder --chown=authservice:nodejs /app/packages/auth-service/node_modules ./node_modules
COPY --from=builder --chown=authservice:nodejs /app/packages/auth-service/package*.json ./

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R authservice:nodejs /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Switch to non-root user
USER authservice

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Development stage
FROM node:18-alpine AS development

# Install development dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    git

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S authservice -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/auth-service/package*.json ./packages/auth-service/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies (including dev dependencies)
RUN npm ci && npm cache clean --force

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/auth-service/ ./packages/auth-service/

# Build shared library
WORKDIR /app/packages/shared
RUN npm run build

# Switch back to auth service directory
WORKDIR /app/packages/auth-service

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R authservice:nodejs /app/logs

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3001
ENV HOST=0.0.0.0

# Expose port and debug port
EXPOSE 3001 9229

# Switch to non-root user
USER authservice

# Start application in development mode with hot reload
CMD ["npm", "run", "start:dev"]

# Testing stage
FROM development AS testing

# Switch to root to install test dependencies
USER root

# Install additional testing tools
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Switch back to non-root user
USER authservice

# Run tests
CMD ["npm", "test"]

# Labels for metadata
LABEL maintainer="ADMS Team <team@adms.ao>"
LABEL version="1.0.0"
LABEL description="Authentication Service for Advanced Document Management System"
LABEL org.opencontainers.image.title="ADMS Auth Service"
LABEL org.opencontainers.image.description="Authentication and authorization microservice"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="ADMS"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/your-org/adms"