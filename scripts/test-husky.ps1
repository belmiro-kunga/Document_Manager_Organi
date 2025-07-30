# Test Husky hooks
Write-Host "🧪 Testing Husky hooks..." -ForegroundColor Yellow

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

# Check environment
$isWSL = $env:WSL_DISTRO_NAME -ne $null
$isWindows = $env:OS -eq "Windows_NT"
$huskyDisabled = $env:HUSKY -eq "0"

Write-Host "Environment:" -ForegroundColor Cyan
Write-Host "  - Windows: $isWindows" -ForegroundColor Gray
Write-Host "  - WSL: $isWSL" -ForegroundColor Gray
Write-Host "  - Husky disabled: $huskyDisabled" -ForegroundColor Gray

# Test if hooks are working
if ($huskyDisabled) {
    Write-Host "⚠️  Husky is disabled (HUSKY=0)" -ForegroundColor Yellow
    Write-Host "   This is normal for problematic WSL environments" -ForegroundColor Gray
    Write-Host "   Use 'npm run lint:manual' for manual linting" -ForegroundColor Gray
} else {
    Write-Host "✅ Husky is enabled" -ForegroundColor Green
    
    # Check if hook files exist
    $preCommitExists = Test-Path ".husky/pre-commit"
    $commitMsgExists = Test-Path ".husky/commit-msg"
    $huskyShExists = Test-Path ".husky/_/husky.sh"
    
    Write-Host "`nHook files:" -ForegroundColor Cyan
    Write-Host "  - pre-commit: $preCommitExists" -ForegroundColor Gray
    Write-Host "  - commit-msg: $commitMsgExists" -ForegroundColor Gray
    Write-Host "  - husky.sh: $huskyShExists" -ForegroundColor Gray
    
    if ($preCommitExists -and $commitMsgExists -and $huskyShExists) {
        Write-Host "✅ All hook files are present" -ForegroundColor Green
    } else {
        Write-Host "❌ Some hook files are missing" -ForegroundColor Red
        Write-Host "   Run 'npm run husky:fix' to reinstall" -ForegroundColor Gray
    }
    
    # Test if npx is available
    $npxAvailable = Test-Command "npx"
    Write-Host "`nTools:" -ForegroundColor Cyan
    Write-Host "  - npx available: $npxAvailable" -ForegroundColor Gray
    
    if (-not $npxAvailable) {
        Write-Host "❌ npx not found - hooks may not work properly" -ForegroundColor Red
    }
}

# Check lint-staged configuration
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $hasLintStaged = $packageJson."lint-staged" -ne $null
    
    Write-Host "`nConfiguration:" -ForegroundColor Cyan
    Write-Host "  - lint-staged configured: $hasLintStaged" -ForegroundColor Gray
    
    if (-not $hasLintStaged) {
        Write-Host "⚠️  lint-staged not configured in package.json" -ForegroundColor Yellow
    }
}

# Provide recommendations
Write-Host "`n📋 Recommendations:" -ForegroundColor Cyan

if ($huskyDisabled) {
    Write-Host "  1. Use 'npm run lint:manual' before each commit" -ForegroundColor Gray
    Write-Host "  2. Consider setting up a proper Linux environment if you need Husky" -ForegroundColor Gray
} else {
    Write-Host "  1. Try making a test commit to verify hooks work" -ForegroundColor Gray
    Write-Host "  2. If hooks fail, run 'npm run husky:fix'" -ForegroundColor Gray
}

Write-Host "  3. Always run 'npm run format' before committing" -ForegroundColor Gray
Write-Host "  4. Use conventional commit messages (feat, fix, etc.)" -ForegroundColor Gray

Write-Host "`nHook test completed!" -ForegroundColor Green