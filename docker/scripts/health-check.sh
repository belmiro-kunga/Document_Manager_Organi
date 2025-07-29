#!/bin/bash
# Health check script for Advanced Document Management System services
# Script de verificação de saúde para serviços do Sistema de Gestão Documental Avançado

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local service=$2
    local message=$3
    
    case $status in
        "OK")
            echo -e "${GREEN}✓${NC} ${service}: ${message}"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠${NC} ${service}: ${message}"
            ;;
        "ERROR")
            echo -e "${RED}✗${NC} ${service}: ${message}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ${NC} ${service}: ${message}"
            ;;
    esac
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_status "ERROR" "Docker" "Docker is not running"
        exit 1
    fi
    print_status "OK" "Docker" "Docker is running"
}

# Check PostgreSQL
check_postgres() {
    local container_name="adms-postgres-dev"
    
    if ! docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        print_status "ERROR" "PostgreSQL" "Container not running"
        return 1
    fi
    
    if docker exec $container_name pg_isready -U adms_user -d adms_dev > /dev/null 2>&1; then
        print_status "OK" "PostgreSQL" "Database is ready"
        
        # Check database connection
        local db_version=$(docker exec $container_name psql -U adms_user -d adms_dev -t -c "SELECT version();" | head -n 1 | xargs)
        print_status "INFO" "PostgreSQL" "Version: ${db_version:0:50}..."
    else
        print_status "ERROR" "PostgreSQL" "Database is not ready"
        return 1
    fi
}

# Check Redis
check_redis() {
    local container_name="adms-redis-dev"
    
    if ! docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        print_status "ERROR" "Redis" "Container not running"
        return 1
    fi
    
    if docker exec $container_name redis-cli -a redis_password ping > /dev/null 2>&1; then
        print_status "OK" "Redis" "Redis is responding"
        
        # Check Redis info
        local redis_version=$(docker exec $container_name redis-cli -a redis_password info server | grep "redis_version" | cut -d: -f2 | tr -d '\r')
        print_status "INFO" "Redis" "Version: ${redis_version}"
    else
        print_status "ERROR" "Redis" "Redis is not responding"
        return 1
    fi
}

# Check ElasticSearch
check_elasticsearch() {
    local container_name="adms-elasticsearch-dev"
    
    if ! docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        print_status "ERROR" "ElasticSearch" "Container not running"
        return 1
    fi
    
    if docker exec $container_name curl -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        print_status "OK" "ElasticSearch" "Cluster is healthy"
        
        # Check cluster status
        local cluster_status=$(docker exec $container_name curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*' | cut -d'"' -f4)
        print_status "INFO" "ElasticSearch" "Cluster status: ${cluster_status}"
    else
        print_status "ERROR" "ElasticSearch" "Cluster is not healthy"
        return 1
    fi
}

# Check MinIO
check_minio() {
    local container_name="adms-minio-dev"
    
    if ! docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        print_status "ERROR" "MinIO" "Container not running"
        return 1
    fi
    
    if docker exec $container_name curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        print_status "OK" "MinIO" "MinIO is healthy"
        
        # Check buckets
        local buckets=$(docker exec $container_name mc ls minio/ 2>/dev/null | wc -l)
        print_status "INFO" "MinIO" "Buckets available: ${buckets}"
    else
        print_status "ERROR" "MinIO" "MinIO is not healthy"
        return 1
    fi
}

# Check all services
check_all_services() {
    echo -e "${BLUE}=== Advanced DMS Health Check ===${NC}"
    echo ""
    
    local failed_services=0
    
    check_docker || ((failed_services++))
    check_postgres || ((failed_services++))
    check_redis || ((failed_services++))
    check_elasticsearch || ((failed_services++))
    check_minio || ((failed_services++))
    
    echo ""
    if [ $failed_services -eq 0 ]; then
        print_status "OK" "System" "All services are healthy"
        echo -e "${GREEN}=== Health Check Passed ===${NC}"
        exit 0
    else
        print_status "ERROR" "System" "${failed_services} service(s) failed health check"
        echo -e "${RED}=== Health Check Failed ===${NC}"
        exit 1
    fi
}

# Check specific service or all
case "${1:-all}" in
    "postgres"|"postgresql")
        check_postgres
        ;;
    "redis")
        check_redis
        ;;
    "elasticsearch"|"es")
        check_elasticsearch
        ;;
    "minio")
        check_minio
        ;;
    "all"|"")
        check_all_services
        ;;
    *)
        echo "Usage: $0 [postgres|redis|elasticsearch|minio|all]"
        exit 1
        ;;
esac