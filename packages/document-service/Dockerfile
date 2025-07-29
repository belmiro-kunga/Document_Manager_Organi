# Multi-stage Dockerfile for Document Service
# Dockerfile multi-estágio para o Serviço de Documentos

# Stage 1: Base image with Node.js
FROM node:18-alpine AS base
LABEL maintainer="Advanced DMS Team <dev@adms.ao>"
LABEL description="Document management service for Advanced DMS"

# Install system dependencies for file processing
RUN apk add --no-cache \
    dumb-init \
    imagemagick \
    ghostscript \
    poppler-utils \
    libreoffice \
    curl

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S adms -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/document-service/package*.json ./packages/document-service/
COPY packages/shared/package*.json ./packages/shared/

# Stage 2: Dependencies installation
FROM base AS deps

# Install production dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Install dev dependencies in separate layer
FROM base AS deps-dev
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Stage 3: Build stage
FROM deps-dev AS build

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/document-service/ ./packages/document-service/
COPY tsconfig.json ./
COPY .eslintrc.js ./

# Build shared library first
WORKDIR /app/packages/shared
RUN npm run build

# Build document service
WORKDIR /app/packages/document-service
RUN npm run build

# Stage 4: Development image
FROM base AS development
ENV NODE_ENV=development

# Copy dev dependencies
COPY --from=deps-dev /app/node_modules ./node_modules
COPY --from=deps-dev /app/packages/document-service/node_modules ./packages/document-service/node_modules
COPY --from=deps-dev /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/document-service/ ./packages/document-service/
COPY tsconfig.json ./

# Create storage directories
RUN mkdir -p /app/storage/documents /app/storage/uploads /app/storage/temp && \
    chown -R adms:nodejs /app

USER adms

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start command for development (with hot reload)
CMD ["dumb-init", "npm", "run", "dev"]

# Stage 5: Production image
FROM base AS production
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/document-service/node_modules ./packages/document-service/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built application
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/document-service/dist ./packages/document-service/dist

# Copy package.json files for runtime
COPY packages/shared/package.json ./packages/shared/
COPY packages/document-service/package.json ./packages/document-service/

# Create storage directories
RUN mkdir -p /app/storage/documents /app/storage/uploads /app/storage/temp && \
    chown -R adms:nodejs /app

USER adms

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start command for production
CMD ["dumb-init", "node", "packages/document-service/dist/index.js"]

# Default target is development
FROM development AS default