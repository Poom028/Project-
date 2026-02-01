# PowerShell Script to Run Tests with Coverage Report
# Usage: .\run_tests_coverage.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Tests with Coverage Report" -ForegroundColor Cyan
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
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Check if pytest-cov is installed
Write-Host "Checking for pytest-cov..." -ForegroundColor Yellow
try {
    python -c "import pytest_cov" 2>&1 | Out-Null
    Write-Host "pytest-cov is installed" -ForegroundColor Green
} catch {
    Write-Host "Installing pytest-cov..." -ForegroundColor Yellow
    pip install pytest-cov
}

Write-Host ""
Write-Host "Running tests with coverage..." -ForegroundColor Yellow
Write-Host ""

# Run tests with coverage
python -m pytest tests/test_api.py -v --cov=app --cov-report=term-missing --cov-report=html

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    Write-Host "Coverage report generated in htmlcov/index.html" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ Some tests failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit $LASTEXITCODE
}
