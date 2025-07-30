# Manual lint and format script
# Use this when Husky is disabled

Write-Host "🧹 Running manual lint and format..." -ForegroundColor Yellow

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

$success = $true

# Run lint-staged if available
if (Test-Command "npx") {
    Write-Host "Running lint-staged..." -ForegroundColor Cyan
    npx lint-staged
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lint-staged completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Lint-staged failed" -ForegroundColor Red
        $success = $false
    }
} else {
    Write-Host "⚠️  npx not available, skipping lint-staged" -ForegroundColor Yellow
}

# Run prettier format
Write-Host "Running prettier format..." -ForegroundColor Cyan
npm run format

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Formatting completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Formatting failed" -ForegroundColor Red
    $success = $false
}

# Run ESLint if available
if (Test-Command "npx") {
    Write-Host "Running ESLint..." -ForegroundColor Cyan
    npx eslint . --ext .js,.ts,.tsx --fix
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ESLint completed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ESLint found issues (but continued)" -ForegroundColor Yellow
    }
}

if ($success) {
    Write-Host "🎉 Manual lint and format completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some linting steps failed. Please fix the issues before committing." -ForegroundColor Red
    exit 1
}