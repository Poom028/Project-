# PowerShell Script to Check Books in MongoDB
# Usage: .\check_books.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Books in MongoDB Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python Version: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Change to backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
Set-Location $backendPath

Write-Host ""
Write-Host "Running check script..." -ForegroundColor Yellow
Write-Host ""

# Run the check script
python check_books_in_db.py

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Check Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
