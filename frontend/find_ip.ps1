# PowerShell Script to Find Local IP Address
# Usage: .\find_ip.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Finding Local IP Address for Mobile Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get all network adapters with IPv4 addresses
# เน้นหา Wi-Fi adapter ก่อน (เพราะมักจะใช้สำหรับ mobile connection)
$wifiAdapter = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*WiFi*" -or $_.InterfaceAlias -like "*Wireless*"
} | Where-Object {
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*"
} | Select-Object IPAddress, InterfaceAlias, PrefixOrigin

# ถ้าไม่มี Wi-Fi ให้หา adapter อื่นๆ
if ($wifiAdapter.Count -eq 0) {
    $adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -notlike "127.*" -and 
        $_.IPAddress -notlike "169.254.*"
    } | Where-Object {
        $_.InterfaceAlias -notlike "*vEthernet*" -and
        $_.InterfaceAlias -notlike "*VirtualBox*" -and
        $_.InterfaceAlias -notlike "*WSL*"
    } | Select-Object IPAddress, InterfaceAlias, PrefixOrigin
} else {
    $adapters = $wifiAdapter
}

if ($adapters.Count -eq 0) {
    Write-Host "⚠️  No suitable IP address found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Trying all IPv4 addresses..." -ForegroundColor Yellow
    $allAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -notlike "127.*"
    } | Select-Object IPAddress, InterfaceAlias
    
    foreach ($adapter in $allAdapters) {
        Write-Host "  - $($adapter.IPAddress) ($($adapter.InterfaceAlias))" -ForegroundColor White
    }
} else {
    Write-Host "✅ Found IP Address(es):" -ForegroundColor Green
    Write-Host ""
    
    foreach ($adapter in $adapters) {
        $ip = $adapter.IPAddress
        $name = $adapter.InterfaceAlias
        Write-Host "  📍 IP Address: $ip" -ForegroundColor Green
        Write-Host "     Interface: $name" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  📝 Copy this to frontend/src/config/api.js:" -ForegroundColor Yellow
        Write-Host "     const IP_ADDRESS = '$ip';" -ForegroundColor Cyan
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "1. Copy the IP address above" -ForegroundColor White
Write-Host "2. Open frontend/src/config/api.js" -ForegroundColor White
Write-Host "3. Replace IP_ADDRESS with your IP" -ForegroundColor White
Write-Host "4. Make sure your phone and computer are on the same WiFi" -ForegroundColor White
Write-Host "5. Make sure Backend is running on port 8000" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
