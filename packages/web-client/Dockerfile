# Multi-stage Dockerfile for Web Client (React)
# Dockerfile multi-estágio para o Cliente Web (React)

# Stage 1: Base image with Node.js
FROM node:18-alpine AS base
LABEL maintainer="Advanced DMS Team <dev@adms.ao>"
LABEL description="React web client for Advanced DMS"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S adms -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/web-client/package*.json ./packages/web-client/
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
COPY packages/web-client/ ./packages/web-client/
COPY tsconfig.json ./
COPY .eslintrc.js ./

# Build shared library first
WORKDIR /app/packages/shared
RUN npm run build

# Build web client
WORKDIR /app/packages/web-client
RUN npm run build

# Stage 4: Development image
FROM base AS development
ENV NODE_ENV=development

# Copy dev dependencies
COPY --from=deps-dev /app/node_modules ./node_modules
COPY --from=deps-dev /app/packages/web-client/node_modules ./packages/web-client/node_modules
COPY --from=deps-dev /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/web-client/ ./packages/web-client/
COPY tsconfig.json ./

# Change ownership to nodejs user
RUN chown -R adms:nodejs /app
USER adms

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start command for development (with hot reload)
CMD ["dumb-init", "npm", "run", "dev"]

# Stage 5: Production build with Nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application from build stage
COPY --from=build /app/packages/web-client/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY packages/web-client/nginx.conf /etc/nginx/nginx.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx-adms && \
    adduser -S adms -u 1001 -G nginx-adms && \
    chown -R adms:nginx-adms /usr/share/nginx/html && \
    chown -R adms:nginx-adms /var/cache/nginx && \
    chown -R adms:nginx-adms /var/log/nginx && \
    chown -R adms:nginx-adms /etc/nginx/conf.d

# Switch to non-root user
USER adms

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Default target is development
FROM development AS default