# Script to test Docker builds
# Script para testar builds Docker
param(
    [string]$Service = "all",
    [switch]$Production,
    [switch]$Development
)

function Write-Step {
    param([string]$Message)
    Write-Host "🔧 $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-DockerBuild {
    param(
        [string]$ServiceName,
        [string]$DockerfilePath,
        [string]$BuildContext = "."
    )
    
    Write-Step "Testing build for $ServiceName..."
    
    try {
        $buildCommand = "docker build -f $DockerfilePath -t adms-$ServiceName-test $BuildContext"
        Write-Host "Running: $buildCommand" -ForegroundColor Gray
        
        Invoke-Expression $buildCommand
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$ServiceName build successful"
            # Clean up test image
            docker rmi "adms-$ServiceName-test" -f | Out-Null
            return $true
        } else {
            Write-Error "$ServiceName build failed"
            return $false
        }
    }
    catch {
        Write-Error "$ServiceName build failed with exception: $($_.Exception.Message)"
        return $false
    }
}

function Test-AllBuilds {
    param([bool]$TestProduction, [bool]$TestDevelopment)
    
    $services = @(
        @{Name="auth-service"; Path="packages/auth-service"},
        @{Name="document-service"; Path="packages/document-service"},
        @{Name="python-analysis"; Path="packages/python-analysis"},
        @{Name="web-client"; Path="packages/web-client"}
    )
    
    $results = @()
    
    foreach ($service in $services) {
        if ($TestProduction) {
            Write-Step "Testing production build for $($service.Name)..."
            $result = Test-DockerBuild -ServiceName "$($service.Name)-prod" -DockerfilePath "$($service.Path)/Dockerfile"
            $results += @{Service="$($service.Name)-prod"; Success=$result}
        }
        
        if ($TestDevelopment -and $service.Name -ne "python-analysis") {
            Write-Step "Testing development build for $($service.Name)..."
            $result = Test-DockerBuild -ServiceName "$($service.Name)-dev" -DockerfilePath "$($service.Path)/Dockerfile.dev"
            $results += @{Service="$($service.Name)-dev"; Success=$result}
        }
    }
    
    return $results
}

function Test-SingleService {
    param([string]$ServiceName, [bool]$TestProduction, [bool]$TestDevelopment)
    
    $results = @()
    
    if ($TestProduction) {
        $result = Test-DockerBuild -ServiceName "$ServiceName-prod" -DockerfilePath "packages/$ServiceName/Dockerfile"
        $results += @{Service="$ServiceName-prod"; Success=$result}
    }
    
    if ($TestDevelopment -and $ServiceName -ne "python-analysis") {
        $result = Test-DockerBuild -ServiceName "$ServiceName-dev" -DockerfilePath "packages/$ServiceName/Dockerfile.dev"
        $results += @{Service="$ServiceName-dev"; Success=$result}
    }
    
    return $results
}

function Show-Results {
    param([array]$Results)
    
    Write-Host "`n📊 Build Test Results:" -ForegroundColor Yellow
    Write-Host "========================" -ForegroundColor Yellow
    
    $successful = 0
    $failed = 0
    
    foreach ($result in $Results) {
        if ($result.Success) {
            Write-Success "$($result.Service): PASSED"
            $successful++
        } else {
            Write-Error "$($result.Service): FAILED"
            $failed++
        }
    }
    
    Write-Host "`nSummary:" -ForegroundColor Yellow
    Write-Host "✅ Successful: $successful" -ForegroundColor Green
    Write-Host "❌ Failed: $failed" -ForegroundColor Red
    Write-Host "📊 Total: $($successful + $failed)" -ForegroundColor Blue
    
    if ($failed -gt 0) {
        exit 1
    }
}

# Main execution
Write-Host "🐳 Docker Build Test Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Check if Docker is available
try {
    docker --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker is not available or not running"
        exit 1
    }
}
catch {
    Write-Error "Docker is not available or not running"
    exit 1
}

# Set default behavior if no flags provided
if (-not $Production -and -not $Development) {
    $Production = $true
    $Development = $true
}

$results = @()

if ($Service -eq "all") {
    Write-Step "Testing all services..."
    $results = Test-AllBuilds -TestProduction $Production -TestDevelopment $Development
} else {
    Write-Step "Testing service: $Service"
    $results = Test-SingleService -ServiceName $Service -TestProduction $Production -TestDevelopment $Development
}

Show-Results -Results $results