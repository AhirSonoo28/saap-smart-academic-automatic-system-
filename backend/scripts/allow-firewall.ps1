# PowerShell script to allow Node.js through Windows Firewall for port 5000
# Run this script as Administrator

Write-Host "Adding firewall rule for port 5000..." -ForegroundColor Yellow

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Remove existing rule if it exists
$existingRule = Get-NetFirewallRule -DisplayName "Node.js Backend Port 5000" -ErrorAction SilentlyContinue
if ($existingRule) {
    Remove-NetFirewallRule -DisplayName "Node.js Backend Port 5000"
    Write-Host "Removed existing firewall rule" -ForegroundColor Yellow
}

# Add new firewall rule
New-NetFirewallRule -DisplayName "Node.js Backend Port 5000" `
    -Direction Inbound `
    -LocalPort 5000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any

if ($?) {
    Write-Host "SUCCESS: Firewall rule added for port 5000" -ForegroundColor Green
    Write-Host "Your backend server should now be accessible from Android emulator/device" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to add firewall rule" -ForegroundColor Red
    exit 1
}

