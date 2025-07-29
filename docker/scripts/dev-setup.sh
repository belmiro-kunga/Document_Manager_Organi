#!/bin/bash
# Development environment setup script
# Script de configuração do ambiente de desenvolvimento

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_step() {
    print_message $BLUE "🔧 $1"
}

print_success() {
    print_message $GREEN "✅ $1"
}

print_warning() {
    print_message $YELLOW "⚠️  $1"
}

print_error() {
    print_message $RED "❌ $1"
}

# Check if Docker is installed and running
check_docker() {
    print_step "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_step "Checking Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    
    mkdir -p storage/documents
    mkdir -p storage/backups
    mkdir -p storage/minio
    mkdir -p storage/uploads
    mkdir -p logs
    mkdir -p docker/postgres/data
    mkdir -p docker/redis/data
    mkdir -p docker/elasticsearch/data
    
    print_success "Directories created"
}

# Create environment file if it doesn't exist
create_env_file() {
    print_step "Creating environment file..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Advanced Document Management System - Development Environment
# Sistema de Gestão Documental Avançado - Ambiente de Desenvolvimento

# Environment
NODE_ENV=development
DEBUG=true

# Database
DATABASE_URL=postgresql://adms_user:adms_password@localhost:5432/adms_dev
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=adms_dev
DATABASE_USER=adms_user
DATABASE_PASSWORD=adms_password

# Redis
REDIS_URL=redis://:redis_password@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# ElasticSearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# MinIO (S3-compatible)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_DOCUMENTS=adms-documents
MINIO_BUCKET_BACKUPS=adms-backups

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-for-development-only
JWT_EXPIRES_IN=24h

# Storage
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./storage/documents

# External APIs
OPENAI_API_KEY=your-openai-api-key-here

# Email (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=debug
LOG_FORMAT=dev

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# API
API_PREFIX=/api/v1
API_PORT=8000

# Services Ports
AUTH_SERVICE_PORT=3001
DOCUMENT_SERVICE_PORT=3002
PYTHON_ANALYSIS_PORT=8001
WEB_CLIENT_PORT=3000
EOF
        print_success "Environment file created (.env)"
    else
        print_warning "Environment file already exists (.env)"
    fi
}

# Pull Docker images
pull_images() {
    print_step "Pulling Docker images..."
    
    docker pull postgres:15-alpine
    docker pull redis:7-alpine
    docker pull docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    docker pull minio/minio:latest
    docker pull minio/mc:latest
    
    print_success "Docker images pulled"
}

# Start services
start_services() {
    print_step "Starting development services..."
    
    # Use docker-compose or docker compose based on availability
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.dev.yml up -d
    else
        docker compose -f docker-compose.dev.yml up -d
    fi
    
    print_success "Services started"
}

# Wait for services to be ready
wait_for_services() {
    print_step "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    echo "Waiting for PostgreSQL..."
    for i in {1..30}; do
        if docker exec adms-postgres-dev pg_isready -U adms_user -d adms_dev > /dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    # Wait for Redis
    echo "Waiting for Redis..."
    for i in {1..30}; do
        if docker exec adms-redis-dev redis-cli -a redis_password ping > /dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    # Wait for ElasticSearch
    echo "Waiting for ElasticSearch..."
    for i in {1..60}; do
        if docker exec adms-elasticsearch-dev curl -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
            break
        fi
        sleep 3
    done
    
    # Wait for MinIO
    echo "Waiting for MinIO..."
    for i in {1..30}; do
        if docker exec adms-minio-dev curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    print_success "All services are ready"
}

# Run health check
run_health_check() {
    print_step "Running health check..."
    
    if [ -f "docker/scripts/health-check.sh" ]; then
        bash docker/scripts/health-check.sh
    else
        print_warning "Health check script not found"
    fi
}

# Show service URLs
show_service_urls() {
    print_step "Service URLs:"
    echo ""
    echo "📊 Services:"
    echo "  • PostgreSQL:     localhost:5432"
    echo "  • Redis:          localhost:6379"
    echo "  • ElasticSearch:  http://localhost:9200"
    echo "  • MinIO:          http://localhost:9000"
    echo "  • MinIO Console:  http://localhost:9001"
    echo ""
    echo "🔧 Management:"
    echo "  • Kibana:         http://localhost:5601 (optional)"
    echo ""
    echo "🔑 Credentials:"
    echo "  • PostgreSQL:     adms_user / adms_password"
    echo "  • Redis:          redis_password"
    echo "  • MinIO:          minioadmin / minioadmin123"
    echo ""
    print_success "Development environment is ready!"
}

# Main execution
main() {
    echo ""
    print_message $BLUE "🚀 Advanced Document Management System - Development Setup"
    echo ""
    
    check_docker
    check_docker_compose
    create_directories
    create_env_file
    pull_images
    start_services
    wait_for_services
    run_health_check
    show_service_urls
    
    echo ""
    print_message $GREEN "🎉 Setup completed successfully!"
    echo ""
    print_message $YELLOW "Next steps:"
    echo "  1. Install dependencies: npm install"
    echo "  2. Start development: npm run dev"
    echo "  3. Check health: ./docker/scripts/health-check.sh"
    echo ""
}

# Run main function
main "$@"