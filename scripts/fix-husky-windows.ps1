# Fix Husky for Windows Environment
# Script para corrigir problemas do Husky no Windows

Write-Host "Fixing Husky configuration for Windows..." -ForegroundColor Yellow

# Check if we're in WSL
$isWSL = $env:WSL_DISTRO_NAME -ne $null
$isWindows = $env:OS -eq "Windows_NT"

Write-Host "Environment detected:" -ForegroundColor Cyan
Write-Host "  - Windows: $isWindows" -ForegroundColor Gray
Write-Host "  - WSL: $isWSL" -ForegroundColor Gray

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check required tools
$nodeExists = Test-Command "node"
$npmExists = Test-Command "npm"
$npxExists = Test-Command "npx"

Write-Host "`nTool availability:" -ForegroundColor Cyan
Write-Host "  - Node.js: $nodeExists" -ForegroundColor Gray
Write-Host "  - npm: $npmExists" -ForegroundColor Gray
Write-Host "  - npx: $npxExists" -ForegroundColor Gray

if (-not $nodeExists -or -not $npmExists) {
    Write-Host "❌ Node.js or npm not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Disable Husky if in problematic environment
if ($isWSL -and -not (Test-Path "/bin/bash")) {
    Write-Host "⚠️  WSL environment detected without proper bash. Disabling Husky..." -ForegroundColor Yellow
    
    # Set environment variable to disable Husky
    [Environment]::SetEnvironmentVariable("HUSKY", "0", "User")
    $env:HUSKY = "0"
    
    Write-Host "✅ Husky disabled for this session and user profile." -ForegroundColor Green
    Write-Host "   You can re-enable it later by removing the HUSKY=0 environment variable." -ForegroundColor Gray
    
    # Create a bypass script for manual linting
    $bypassScript = @"
# Manual lint and format script
# Use this when Husky is disabled

Write-Host "🧹 Running manual lint and format..." -ForegroundColor Yellow

# Run lint-staged if available
if (Test-Command "npx") {
    Write-Host "Running lint-staged..." -ForegroundColor Cyan
    npx lint-staged
    
    if (`$LASTEXITCODE -eq 0) {
        Write-Host "✅ Lint-staged completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Lint-staged failed" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  npx not available, skipping lint-staged" -ForegroundColor Yellow
}

# Run prettier format
Write-Host "Running prettier format..." -ForegroundColor Cyan
npm run format

if (`$LASTEXITCODE -eq 0) {
    Write-Host "✅ Formatting completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Formatting failed" -ForegroundColor Red
}

Write-Host "🎉 Manual lint and format completed!" -ForegroundColor Green
"@
    
    $bypassScript | Out-File -FilePath "scripts/manual-lint.ps1" -Encoding UTF8
    Write-Host "Created manual-lint.ps1 script for manual linting" -ForegroundColor Cyan
    
} else {
    Write-Host "✅ Environment looks good for Husky" -ForegroundColor Green
    
    # Ensure Husky is enabled
    [Environment]::SetEnvironmentVariable("HUSKY", $null, "User")
    $env:HUSKY = $null
    
    # Reinstall Husky to ensure proper setup
    Write-Host "🔄 Reinstalling Husky..." -ForegroundColor Cyan
    
    try {
        npm uninstall husky --save-dev
        npm install husky --save-dev
        npx husky install
        
        Write-Host "✅ Husky reinstalled successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to reinstall Husky: $_" -ForegroundColor Red
    }
}

# Create a test script to verify hooks work
$testScript = @"
# Test Husky hooks
Write-Host "🧪 Testing Husky hooks..." -ForegroundColor Yellow

# Test if hooks are working
if (`$env:HUSKY -eq "0") {
    Write-Host "⚠️  Husky is disabled (HUSKY=0)" -ForegroundColor Yellow
    Write-Host "   Use scripts/manual-lint.ps1 for manual linting" -ForegroundColor Gray
} else {
    Write-Host "✅ Husky is enabled" -ForegroundColor Green
    
    # Check if hook files exist and are executable
    if (Test-Path ".husky/pre-commit") {
        Write-Host "✅ pre-commit hook exists" -ForegroundColor Green
    } else {
        Write-Host "❌ pre-commit hook missing" -ForegroundColor Red
    }
    
    if (Test-Path ".husky/commit-msg") {
        Write-Host "✅ commit-msg hook exists" -ForegroundColor Green
    } else {
        Write-Host "❌ commit-msg hook missing" -ForegroundColor Red
    }
}

Write-Host "🎉 Hook test completed!" -ForegroundColor Green
"@

$testScript | Out-File -FilePath "scripts/test-husky.ps1" -Encoding UTF8
Write-Host "Created test-husky.ps1 script for testing hooks" -ForegroundColor Cyan

# Update package.json scripts
Write-Host "Updating package.json scripts..." -ForegroundColor Cyan

$packageJsonPath = "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    # Add helper scripts
    if (-not $packageJson.scripts) {
        $packageJson.scripts = @{}
    }
    
    $packageJson.scripts."husky:fix" = "powershell -ExecutionPolicy Bypass -File scripts/fix-husky-windows.ps1"
    $packageJson.scripts."husky:test" = "powershell -ExecutionPolicy Bypass -File scripts/test-husky.ps1"
    $packageJson.scripts."lint:manual" = "powershell -ExecutionPolicy Bypass -File scripts/manual-lint.ps1"
    
    # Update postinstall script
    if ($isWSL -and -not (Test-Path "/bin/bash")) {
        $packageJson.scripts.postinstall = "echo 'Husky disabled due to WSL environment issues'"
    } else {
        $packageJson.scripts.postinstall = "husky install"
    }
    
    $packageJson | ConvertTo-Json -Depth 10 | Out-File $packageJsonPath -Encoding UTF8
    Write-Host "✅ Updated package.json with helper scripts" -ForegroundColor Green
}

Write-Host "`n🎉 Husky fix completed!" -ForegroundColor Green
Write-Host "`nAvailable commands:" -ForegroundColor Cyan
Write-Host "  - npm run husky:fix   # Run this script again" -ForegroundColor Gray
Write-Host "  - npm run husky:test  # Test if hooks are working" -ForegroundColor Gray
Write-Host "  - npm run lint:manual # Manual lint when Husky is disabled" -ForegroundColor Gray

if ($env:HUSKY -eq "0") {
    Write-Host "`n⚠️  Husky is currently disabled for your environment." -ForegroundColor Yellow
    Write-Host "   Use 'npm run lint:manual' before committing." -ForegroundColor Gray
} else {
    Write-Host "`n✅ Husky should now work correctly with your commits." -ForegroundColor Green
}