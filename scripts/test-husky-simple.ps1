# Simple Husky test script
Write-Host "Testing Husky configuration..." -ForegroundColor Yellow

# Check if Husky is disabled
$huskyDisabled = $env:HUSKY -eq "0"

if ($huskyDisabled) {
    Write-Host "Husky is disabled (HUSKY=0)" -ForegroundColor Yellow
    Write-Host "Use 'npm run lint:manual' for manual linting" -ForegroundColor Gray
} else {
    Write-Host "Husky is enabled" -ForegroundColor Green
    
    # Check if hook files exist
    $preCommitExists = Test-Path ".husky/pre-commit"
    $commitMsgExists = Test-Path ".husky/commit-msg"
    
    Write-Host "Hook files:" -ForegroundColor Cyan
    Write-Host "  pre-commit: $preCommitExists" -ForegroundColor Gray
    Write-Host "  commit-msg: $commitMsgExists" -ForegroundColor Gray
    
    if ($preCommitExists -and $commitMsgExists) {
        Write-Host "All hook files are present" -ForegroundColor Green
    } else {
        Write-Host "Some hook files are missing" -ForegroundColor Red
    }
}

Write-Host "Test completed!" -ForegroundColor Green