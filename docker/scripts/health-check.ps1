# Health check script for Advanced Document Management System services (PowerShell)
# Script de verificação de saúde para serviços do Sistema de Gestão Documental Avançado (PowerShell)

param(
    [string]$Service = "all"
)

# Function to print colored output
function Write-Status {
    param(
        [string]$Status,
        [string]$ServiceName,
        [string]$Message
    )
    
    switch ($Status) {
        "OK" { 
            Write-Host "✓ " -ForegroundColor Green -NoNewline
            Write-Host "$ServiceName`: $Message"
        }
        "WARN" { 
            Write-Host "⚠ " -ForegroundColor Yellow -NoNewline
            Write-Host "$ServiceName`: $Message"
        }
        "ERROR" { 
            Write-Host "✗ " -ForegroundColor Red -NoNewline
            Write-Host "$ServiceName`: $Message"
        }
        "INFO" { 
            Write-Host "ℹ " -ForegroundColor Blue -NoNewline
            Write-Host "$ServiceName`: $Message"
        }
    }
}

# Check if Docker is running
function Test-Docker {
    try {
        $null = docker info 2>$null
        Write-Status "OK" "Docker" "Docker is running"
        return $true
    }
    catch {
        Write-Status "ERROR" "Docker" "Docker is not running"
        return $false
    }
}

# Check PostgreSQL
function Test-PostgreSQL {
    $containerName = "adms-postgres-dev"
    
    $running = docker ps --format "table {{.Names}}" | Select-String "^$containerName$"
    if (-not $running) {
        Write-Status "ERROR" "PostgreSQL" "Container not running"
        return $false
    }
    
    try {
        $null = docker exec $containerName pg_isready -U adms_user -d adms_dev 2>$null
        Write-Status "OK" "PostgreSQL" "Database is ready"
        
        # Check database version
        $version = docker exec $containerName psql -U adms_user -d adms_dev -t -c "SELECT version();" 2>$null | Select-Object -First 1
        if ($version) {
            $shortVersion = $version.Trim().Substring(0, [Math]::Min(50, $version.Length))
            Write-Status "INFO" "PostgreSQL" "Version: $shortVersion..."
        }
        return $true
    }
    catch {
        Write-Status "ERROR" "PostgreSQL" "Database is not ready"
        return $false
    }
}

# Check Redis
function Test-Redis {
    $containerName = "adms-redis-dev"
    
    $running = docker ps --format "table {{.Names}}" | Select-String "^$containerName$"
    if (-not $running) {
        Write-Status "ERROR" "Redis" "Container not running"
        return $false
    }
    
    try {
        $result = docker exec $containerName redis-cli -a redis_password ping 2>$null
        if ($result -eq "PONG") {
            Write-Status "OK" "Redis" "Redis is responding"
            
            # Check Redis version
            $version = docker exec $containerName redis-cli -a redis_password info server 2>$null | Select-String "redis_version" | ForEach-Object { $_.ToString().Split(':')[1].Trim() }
            if ($version) {
                Write-Status "INFO" "Redis" "Version: $version"
            }
            return $true
        }
        else {
            Write-Status "ERROR" "Redis" "Redis is not responding"
            return $false
        }
    }
    catch {
        Write-Status "ERROR" "Redis" "Redis is not responding"
        return $false
    }
}

# Check ElasticSearch
function Test-ElasticSearch {
    $containerName = "adms-elasticsearch-dev"
    
    $running = docker ps --format "table {{.Names}}" | Select-String "^$containerName$"
    if (-not $running) {
        Write-Status "ERROR" "ElasticSearch" "Container not running"
        return $false
    }
    
    try {
        $null = docker exec $containerName curl -f http://localhost:9200/_cluster/health 2>$null
        Write-Status "OK" "ElasticSearch" "Cluster is healthy"
        
        # Check cluster status
        $health = docker exec $containerName curl -s http://localhost:9200/_cluster/health 2>$null | ConvertFrom-Json
        if ($health.status) {
            Write-Status "INFO" "ElasticSearch" "Cluster status: $($health.status)"
        }
        return $true
    }
    catch {
        Write-Status "ERROR" "ElasticSearch" "Cluster is not healthy"
        return $false
    }
}

# Check MinIO
function Test-MinIO {
    $containerName = "adms-minio-dev"
    
    $running = docker ps --format "table {{.Names}}" | Select-String "^$containerName$"
    if (-not $running) {
        Write-Status "ERROR" "MinIO" "Container not running"
        return $false
    }
    
    try {
        $null = docker exec $containerName curl -f http://localhost:9000/minio/health/live 2>$null
        Write-Status "OK" "MinIO" "MinIO is healthy"
        
        # Check buckets
        $buckets = docker exec $containerName mc ls minio/ 2>$null
        $bucketCount = if ($buckets) { ($buckets | Measure-Object).Count } else { 0 }
        Write-Status "INFO" "MinIO" "Buckets available: $bucketCount"
        return $true
    }
    catch {
        Write-Status "ERROR" "MinIO" "MinIO is not healthy"
        return $false
    }
}

# Check all services
function Test-AllServices {
    Write-Host "=== Advanced DMS Health Check ===" -ForegroundColor Blue
    Write-Host ""
    
    $failedServices = 0
    
    if (-not (Test-Docker)) { $failedServices++ }
    if (-not (Test-PostgreSQL)) { $failedServices++ }
    if (-not (Test-Redis)) { $failedServices++ }
    if (-not (Test-ElasticSearch)) { $failedServices++ }
    if (-not (Test-MinIO)) { $failedServices++ }
    
    Write-Host ""
    if ($failedServices -eq 0) {
        Write-Status "OK" "System" "All services are healthy"
        Write-Host "=== Health Check Passed ===" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Status "ERROR" "System" "$failedServices service(s) failed health check"
        Write-Host "=== Health Check Failed ===" -ForegroundColor Red
        exit 1
    }
}

# Main execution
switch ($Service.ToLower()) {
    { $_ -in @("postgres", "postgresql") } { Test-PostgreSQL }
    "redis" { Test-Redis }
    { $_ -in @("elasticsearch", "es") } { Test-ElasticSearch }
    "minio" { Test-MinIO }
    { $_ -in @("all", "") } { Test-AllServices }
    default {
        Write-Host "Usage: .\health-check.ps1 [postgres|redis|elasticsearch|minio|all]"
        exit 1
    }
}