# Development environment setup script (PowerShell)
# Script de configuração do ambiente de desenvolvimento (PowerShell)

# Function to print colored messages
function Write-Step {
    param([string]$Message)
    Write-Host "🔧 $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if Docker is installed and running
function Test-Docker {
    Write-Step "Checking Docker installation..."
    
    try {
        $null = Get-Command docker -ErrorAction Stop
        $null = docker info 2>$null
        Write-Success "Docker is installed and running"
        return $true
    }
    catch {
        Write-Error "Docker is not installed or not running. Please install and start Docker first."
        return $false
    }
}

# Check if Docker Compose is available
function Test-DockerCompose {
    Write-Step "Checking Docker Compose..."
    
    try {
        $null = docker compose version 2>$null
        Write-Success "Docker Compose is available"
        return $true
    }
    catch {
        try {
            $null = Get-Command docker-compose -ErrorAction Stop
            Write-Success "Docker Compose is available"
            return $true
        }
        catch {
            Write-Error "Docker Compose is not available. Please install Docker Compose."
            return $false
        }
    }
}

# Create necessary directories
function New-Directories {
    Write-Step "Creating necessary directories..."
    
    $directories = @(
        "storage/documents",
        "storage/backups", 
        "storage/minio",
        "storage/uploads",
        "logs",
        "docker/postgres/data",
        "docker/redis/data",
        "docker/elasticsearch/data"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Directories created"
}

# Create environment file if it doesn't exist
function New-EnvFile {
    Write-Step "Creating environment file..."
    
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Success "Environment file created (.env)"
    }
    else {
        Write-Warning "Environment file already exists (.env)"
    }
}

# Pull Docker images
function Get-DockerImages {
    Write-Step "Pulling Docker images..."
    
    $images = @(
        "postgres:15-alpine",
        "redis:7-alpine", 
        "docker.elastic.co/elasticsearch/elasticsearch:8.8.0",
        "minio/minio:latest",
        "minio/mc:latest"
    )
    
    foreach ($image in $images) {
        Write-Host "Pulling $image..." -ForegroundColor Gray
        docker pull $image
    }
    
    Write-Success "Docker images pulled"
}

# Start services
function Start-Services {
    Write-Step "Starting development services..."
    
    try {
        docker compose -f docker-compose.dev.yml up -d
    }
    catch {
        try {
            docker-compose -f docker-compose.dev.yml up -d
        }
        catch {
            Write-Error "Failed to start services"
            return $false
        }
    }
    
    Write-Success "Services started"
    return $true
}

# Wait for services to be ready
function Wait-ForServices {
    Write-Step "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    Write-Host "Waiting for PostgreSQL..." -ForegroundColor Gray
    for ($i = 1; $i -le 30; $i++) {
        try {
            $null = docker exec adms-postgres-dev pg_isready -U adms_user -d adms_dev 2>$null
            break
        }
        catch {
            Start-Sleep 2
        }
    }
    
    # Wait for Redis
    Write-Host "Waiting for Redis..." -ForegroundColor Gray
    for ($i = 1; $i -le 30; $i++) {
        try {
            $result = docker exec adms-redis-dev redis-cli -a redis_password ping 2>$null
            if ($result -eq "PONG") { break }
        }
        catch {
            Start-Sleep 2
        }
    }
    
    # Wait for ElasticSearch
    Write-Host "Waiting for ElasticSearch..." -ForegroundColor Gray
    for ($i = 1; $i -le 60; $i++) {
        try {
            $null = docker exec adms-elasticsearch-dev curl -f http://localhost:9200/_cluster/health 2>$null
            break
        }
        catch {
            Start-Sleep 3
        }
    }
    
    # Wait for MinIO
    Write-Host "Waiting for MinIO..." -ForegroundColor Gray
    for ($i = 1; $i -le 30; $i++) {
        try {
            $null = docker exec adms-minio-dev curl -f http://localhost:9000/minio/health/live 2>$null
            break
        }
        catch {
            Start-Sleep 2
        }
    }
    
    Write-Success "All services are ready"
}

# Run health check
function Invoke-HealthCheck {
    Write-Step "Running health check..."
    
    if (Test-Path "docker/scripts/health-check.ps1") {
        & "docker/scripts/health-check.ps1"
    }
    else {
        Write-Warning "Health check script not found"
    }
}

# Show service URLs
function Show-ServiceUrls {
    Write-Step "Service URLs:"
    Write-Host ""
    Write-Host "📊 Services:" -ForegroundColor Blue
    Write-Host "  • PostgreSQL:     localhost:5432"
    Write-Host "  • Redis:          localhost:6379"
    Write-Host "  • ElasticSearch:  http://localhost:9200"
    Write-Host "  • MinIO:          http://localhost:9000"
    Write-Host "  • MinIO Console:  http://localhost:9001"
    Write-Host ""
    Write-Host "🔧 Management:" -ForegroundColor Blue
    Write-Host "  • Kibana:         http://localhost:5601 (optional)"
    Write-Host ""
    Write-Host "🔑 Credentials:" -ForegroundColor Blue
    Write-Host "  • PostgreSQL:     adms_user / adms_password"
    Write-Host "  • Redis:          redis_password"
    Write-Host "  • MinIO:          minioadmin / minioadmin123"
    Write-Host ""
    Write-Success "Development environment is ready!"
}

# Main execution
Write-Host ""
Write-Host "🚀 Advanced Document Management System - Development Setup" -ForegroundColor Blue
Write-Host ""

if (-not (Test-Docker)) { exit 1 }
if (-not (Test-DockerCompose)) { exit 1 }

New-Directories
New-EnvFile
Get-DockerImages

if (-not (Start-Services)) { exit 1 }

Wait-ForServices
Invoke-HealthCheck
Show-ServiceUrls

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Install dependencies: npm install"
Write-Host "  2. Start development: npm run dev"
Write-Host "  3. Check health: .\docker\scripts\health-check.ps1"
Write-Host ""