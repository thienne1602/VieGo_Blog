# VieGo Blog - Multi-Client Frontend Launcher
# Chạy nhiều client frontend trên các port khác nhau mà không cần copy thư mục

param(
    [int]$ClientCount = 2,
    [int]$StartPort = 3000
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "        VIEGO BLOG - MULTI-CLIENT LAUNCHER" -ForegroundColor Green
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodePaths = @(
    "C:\laragon\bin\nodejs\node-v20\node.exe",
    "C:\Program Files\nodejs\node.exe",
    "C:\nodejs\node.exe"
)

$nodePath = $null
foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodePath = Split-Path $path -Parent
        break
    }
}

if (-not $nodePath) {
    # Try to find node in PATH
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $nodePath = Split-Path $nodeCmd.Source -Parent
    }
}

if (-not $nodePath) {
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js or update nodePaths in this script"
    pause
    exit 1
}

Write-Host "Found Node.js at: $nodePath" -ForegroundColor Green

# Set environment
$env:PATH = "$nodePath;$env:PATH"

# Get project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$frontendDir = Join-Path $projectRoot "frontend"

if (-not (Test-Path $frontendDir)) {
    Write-Host "ERROR: Frontend directory not found at $frontendDir" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Frontend directory: $frontendDir" -ForegroundColor Gray
Write-Host ""
Write-Host "Starting $ClientCount frontend clients..." -ForegroundColor Yellow
Write-Host ""

# Store started process IDs
$clientProcesses = @()

for ($i = 1; $i -le $ClientCount; $i++) {
    $port = $StartPort + $i - 1
    $title = "VieGo Client $i (Port $port)"
    
    Write-Host "Starting Client $i on port $port..." -ForegroundColor Cyan
    
    # Create a temp script for each client to run in its own window
    $tempScript = Join-Path $env:TEMP "viego_client_$i.ps1"
    
    $scriptContent = @"
`$Host.UI.RawUI.WindowTitle = '$title'
`$env:PATH = "$nodePath;`$env:PATH"
Set-Location '$frontendDir'

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  VieGo Blog - Client $i" -ForegroundColor Green
Write-Host "  Port: $port" -ForegroundColor Green  
Write-Host "  URL: http://localhost:$port" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables for this instance
`$env:PORT = $port
`$env:NEXT_TELEMETRY_DISABLED = 1

# Check if node_modules exists
if (-not (Test-Path 'node_modules')) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & npm install
}

# Start dev server
Write-Host "Starting development server on port $port..." -ForegroundColor Green
& npm run dev -- -p $port

Write-Host ""
Write-Host "Client $i stopped. Press any key to exit..." -ForegroundColor Red
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@
    
    Set-Content -Path $tempScript -Value $scriptContent -Encoding UTF8
    
    # Start new PowerShell window for this client
    $process = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $tempScript -PassThru
    $clientProcesses += $process
    
    # Wait a bit between starts to avoid port conflicts
    if ($i -lt $ClientCount) {
        Write-Host "  Waiting 5 seconds before starting next client..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "All $ClientCount clients started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Client URLs:" -ForegroundColor Yellow
for ($i = 1; $i -le $ClientCount; $i++) {
    $port = $StartPort + $i - 1
    Write-Host "  Client $i : http://localhost:$port" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "  - Each client runs in its own window" -ForegroundColor Gray
Write-Host "  - Close a window to stop that specific client" -ForegroundColor Gray
Write-Host "  - All clients share the same source code" -ForegroundColor Gray
Write-Host "  - Login with different accounts in each client to test" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this launcher (clients will keep running)..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
