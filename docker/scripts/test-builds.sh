#!/bin/bash
# Script to test Docker builds
# Script para testar builds Docker

set -e

SERVICE="all"
PRODUCTION=false
DEVELOPMENT=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --service)
            SERVICE="$2"
            shift 2
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
        --development)
            DEVELOPMENT=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--service SERVICE] [--production] [--development]"
            echo "  --service SERVICE    Test specific service (default: all)"
            echo "  --production         Test production builds"
            echo "  --development        Test development builds"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Set default behavior if no flags provided
if [ "$PRODUCTION" = false ] && [ "$DEVELOPMENT" = false ]; then
    PRODUCTION=true
    DEVELOPMENT=true
fi

# Color functions
write_step() {
    echo -e "\033[34m🔧 $1\033[0m"
}

write_success() {
    echo -e "\033[32m✅ $1\033[0m"
}

write_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

write_info() {
    echo -e "\033[36m$1\033[0m"
}

write_warning() {
    echo -e "\033[33m$1\033[0m"
}

# Test Docker build function
test_docker_build() {
    local service_name=$1
    local dockerfile_path=$2
    local build_context=${3:-.}
    
    write_step "Testing build for $service_name..."
    
    local build_command="docker build -f $dockerfile_path -t adms-$service_name-test $build_context"
    echo -e "\033[90mRunning: $build_command\033[0m"
    
    if $build_command; then
        write_success "$service_name build successful"
        # Clean up test image
        docker rmi "adms-$service_name-test" -f > /dev/null 2>&1 || true
        return 0
    else
        write_error "$service_name build failed"
        return 1
    fi
}

# Test all builds function
test_all_builds() {
    local test_production=$1
    local test_development=$2
    
    local services=("auth-service" "document-service" "python-analysis" "web-client")
    local results=()
    local successful=0
    local failed=0
    
    for service in "${services[@]}"; do
        if [ "$test_production" = true ]; then
            write_step "Testing production build for $service..."
            if test_docker_build "$service-prod" "packages/$service/Dockerfile"; then
                results+=("$service-prod:PASSED")
                ((successful++))
            else
                results+=("$service-prod:FAILED")
                ((failed++))
            fi
        fi
        
        if [ "$test_development" = true ] && [ "$service" != "python-analysis" ]; then
            write_step "Testing development build for $service..."
            if test_docker_build "$service-dev" "packages/$service/Dockerfile.dev"; then
                results+=("$service-dev:PASSED")
                ((successful++))
            else
                results+=("$service-dev:FAILED")
                ((failed++))
            fi
        fi
    done
    
    # Show results
    echo
    write_warning "📊 Build Test Results:"
    write_warning "========================"
    
    for result in "${results[@]}"; do
        IFS=':' read -r service status <<< "$result"
        if [ "$status" = "PASSED" ]; then
            write_success "$service: PASSED"
        else
            write_error "$service: FAILED"
        fi
    done
    
    echo
    write_warning "Summary:"
    write_success "Successful: $successful"
    write_error "Failed: $failed"
    write_info "Total: $((successful + failed))"
    
    if [ $failed -gt 0 ]; then
        exit 1
    fi
}

# Test single service function
test_single_service() {
    local service_name=$1
    local test_production=$2
    local test_development=$3
    
    local results=()
    local successful=0
    local failed=0
    
    if [ "$test_production" = true ]; then
        if test_docker_build "$service_name-prod" "packages/$service_name/Dockerfile"; then
            results+=("$service_name-prod:PASSED")
            ((successful++))
        else
            results+=("$service_name-prod:FAILED")
            ((failed++))
        fi
    fi
    
    if [ "$test_development" = true ] && [ "$service_name" != "python-analysis" ]; then
        if test_docker_build "$service_name-dev" "packages/$service_name/Dockerfile.dev"; then
            results+=("$service_name-dev:PASSED")
            ((successful++))
        else
            results+=("$service_name-dev:FAILED")
            ((failed++))
        fi
    fi
    
    # Show results
    echo
    write_warning "📊 Build Test Results:"
    write_warning "========================"
    
    for result in "${results[@]}"; do
        IFS=':' read -r service status <<< "$result"
        if [ "$status" = "PASSED" ]; then
            write_success "$service: PASSED"
        else
            write_error "$service: FAILED"
        fi
    done
    
    echo
    write_warning "Summary:"
    write_success "Successful: $successful"
    write_error "Failed: $failed"
    write_info "Total: $((successful + failed))"
    
    if [ $failed -gt 0 ]; then
        exit 1
    fi
}

# Main execution
write_info "🐳 Docker Build Test Script"
write_info "============================"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    write_error "Docker is not available or not running"
    exit 1
fi

if ! docker --version &> /dev/null; then
    write_error "Docker is not available or not running"
    exit 1
fi

if [ "$SERVICE" = "all" ]; then
    write_step "Testing all services..."
    test_all_builds $PRODUCTION $DEVELOPMENT
else
    write_step "Testing service: $SERVICE"
    test_single_service "$SERVICE" $PRODUCTION $DEVELOPMENT
fi