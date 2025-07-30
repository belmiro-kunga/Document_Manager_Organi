# Simple Husky fix for Windows
Write-Host "Fixing Husky for Windows..." -ForegroundColor Yellow

# Check if we're in a problematic WSL environment
$isWSL = $env:WSL_DISTRO_NAME -ne $null
$bashExists = Test-Path "/bin/bash"

if ($isWSL -and -not $bashExists) {
    Write-Host "WSL environment detected without proper bash. Disabling Husky..." -ForegroundColor Yellow
    
    # Disable Husky
    $env:HUSKY = "0"
    [Environment]::SetEnvironmentVariable("HUSKY", "0", "User")
    
    Write-Host "Husky disabled. Use 'npm run lint:manual' before committing." -ForegroundColor Green
} else {
    Write-Host "Environment looks good. Enabling Husky..." -ForegroundColor Green
    
    # Enable Husky
    $env:HUSKY = $null
    [Environment]::SetEnvironmentVariable("HUSKY", $null, "User")
    
    # Reinstall Husky
    try {
        npx husky install
        Write-Host "Husky installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to install Husky. You may need to run 'npx husky install' manually." -ForegroundColor Red
    }
}

Write-Host "Done! Test with 'npm run husky:test'" -ForegroundColor Cyan