# VieGo Blog Launcher - Simple Version
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$script:backendProcess = $null
$script:frontendProcesses = @()
$script:tunnelProcesses = @()
$script:isRunning = $false
$script:isDemoMode = $false
$script:backendTunnelUrl = ""
$script:frontendTunnelUrl = ""
$script:shareUrlFull = ""
$script:projectPath = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))

# Load System.Web for URL encoding
Add-Type -AssemblyName System.Web

# Create Form
$form = New-Object System.Windows.Forms.Form
$form.Text = 'VieGo Blog - System Launcher'
$form.Size = New-Object System.Drawing.Size(1100, 700)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)

# Title Panel
$titlePanel = New-Object System.Windows.Forms.Panel
$titlePanel.Location = New-Object System.Drawing.Point(0, 0)
$titlePanel.Size = New-Object System.Drawing.Size(1100, 100)
$titlePanel.BackColor = [System.Drawing.Color]::FromArgb(79, 70, 229)

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = 'VIEGO BLOG LAUNCHER'
$titleLabel.Font = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::White
$titleLabel.Location = New-Object System.Drawing.Point(30, 30)
$titleLabel.AutoSize = $true
$titlePanel.Controls.Add($titleLabel)

$form.Controls.Add($titlePanel)

# Config Panel
$configPanel = New-Object System.Windows.Forms.Panel
$configPanel.Location = New-Object System.Drawing.Point(40, 120)
$configPanel.Size = New-Object System.Drawing.Size(1000, 120)
$configPanel.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85)

$clientLabel = New-Object System.Windows.Forms.Label
$clientLabel.Text = 'Frontend Clients:'
$clientLabel.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$clientLabel.ForeColor = [System.Drawing.Color]::White
$clientLabel.Location = New-Object System.Drawing.Point(30, 15)
$clientLabel.AutoSize = $true
$configPanel.Controls.Add($clientLabel)

$clientNumeric = New-Object System.Windows.Forms.NumericUpDown
$clientNumeric.Minimum = 1
$clientNumeric.Maximum = 10
$clientNumeric.Value = 1
$clientNumeric.Font = New-Object System.Drawing.Font('Segoe UI', 14)
$clientNumeric.Location = New-Object System.Drawing.Point(200, 12)
$clientNumeric.Size = New-Object System.Drawing.Size(100, 35)
$configPanel.Controls.Add($clientNumeric)

# Port Management Section
$portLabel = New-Object System.Windows.Forms.Label
$portLabel.Text = 'Port Management:'
$portLabel.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$portLabel.ForeColor = [System.Drawing.Color]::White
$portLabel.Location = New-Object System.Drawing.Point(30, 60)
$portLabel.AutoSize = $true
$configPanel.Controls.Add($portLabel)

$checkPortsButton = New-Object System.Windows.Forms.Button
$checkPortsButton.Text = 'Check Ports'
$checkPortsButton.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$checkPortsButton.BackColor = [System.Drawing.Color]::FromArgb(59, 130, 246)
$checkPortsButton.ForeColor = [System.Drawing.Color]::White
$checkPortsButton.FlatStyle = 'Flat'
$checkPortsButton.Location = New-Object System.Drawing.Point(200, 55)
$checkPortsButton.Size = New-Object System.Drawing.Size(120, 35)
$configPanel.Controls.Add($checkPortsButton)

$killPortsButton = New-Object System.Windows.Forms.Button
$killPortsButton.Text = 'Kill Used Ports'
$killPortsButton.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$killPortsButton.BackColor = [System.Drawing.Color]::FromArgb(239, 68, 68)
$killPortsButton.ForeColor = [System.Drawing.Color]::White
$killPortsButton.FlatStyle = 'Flat'
$killPortsButton.Location = New-Object System.Drawing.Point(340, 55)
$killPortsButton.Size = New-Object System.Drawing.Size(120, 35)
$configPanel.Controls.Add($killPortsButton)

# Demo Mode Section (Remote Access)
$demoLabel = New-Object System.Windows.Forms.Label
$demoLabel.Text = 'Demo Mode (Remote Access):'
$demoLabel.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$demoLabel.ForeColor = [System.Drawing.Color]::White
$demoLabel.Location = New-Object System.Drawing.Point(520, 15)
$demoLabel.AutoSize = $true
$configPanel.Controls.Add($demoLabel)

$demoCheckbox = New-Object System.Windows.Forms.CheckBox
$demoCheckbox.Text = 'Enable (Share via Internet)'
$demoCheckbox.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$demoCheckbox.ForeColor = [System.Drawing.Color]::FromArgb(34, 197, 94)
$demoCheckbox.Location = New-Object System.Drawing.Point(520, 45)
$demoCheckbox.Size = New-Object System.Drawing.Size(200, 25)
$demoCheckbox.Checked = $false
$configPanel.Controls.Add($demoCheckbox)

$demoInfoLabel = New-Object System.Windows.Forms.Label
$demoInfoLabel.Text = '(Cloudflare Tunnel - Fast & No Password!)'
$demoInfoLabel.Font = New-Object System.Drawing.Font('Segoe UI', 8)
$demoInfoLabel.ForeColor = [System.Drawing.Color]::FromArgb(34, 197, 94)
$demoInfoLabel.Location = New-Object System.Drawing.Point(520, 70)
$demoInfoLabel.AutoSize = $true
$configPanel.Controls.Add($demoInfoLabel)

$form.Controls.Add($configPanel)

# Status Panel
$statusPanel = New-Object System.Windows.Forms.Panel
$statusPanel.Location = New-Object System.Drawing.Point(40, 260)
$statusPanel.Size = New-Object System.Drawing.Size(1000, 70)
$statusPanel.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = 'Status: Not started'
$statusLabel.Font = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::Gray
$statusLabel.Location = New-Object System.Drawing.Point(30, 10)
$statusLabel.AutoSize = $true
$statusPanel.Controls.Add($statusLabel)

# Tunnel URLs Label
$tunnelUrlLabel = New-Object System.Windows.Forms.Label
$tunnelUrlLabel.Text = ''
$tunnelUrlLabel.Font = New-Object System.Drawing.Font('Consolas', 9)
$tunnelUrlLabel.ForeColor = [System.Drawing.Color]::FromArgb(34, 197, 94)
$tunnelUrlLabel.Location = New-Object System.Drawing.Point(30, 40)
$tunnelUrlLabel.Size = New-Object System.Drawing.Size(940, 25)
$statusPanel.Controls.Add($tunnelUrlLabel)

$form.Controls.Add($statusPanel)

# Log Panel
$logPanel = New-Object System.Windows.Forms.Panel
$logPanel.Location = New-Object System.Drawing.Point(40, 350)
$logPanel.Size = New-Object System.Drawing.Size(1000, 200)
$logPanel.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85)

$logTextBox = New-Object System.Windows.Forms.RichTextBox
$logTextBox.Location = New-Object System.Drawing.Point(20, 20)
$logTextBox.Size = New-Object System.Drawing.Size(960, 160)
$logTextBox.Font = New-Object System.Drawing.Font('Consolas', 9)
$logTextBox.ReadOnly = $true
$logTextBox.BackColor = [System.Drawing.Color]::FromArgb(17, 24, 39)
$logTextBox.ForeColor = [System.Drawing.Color]::Lime
$logPanel.Controls.Add($logTextBox)

$form.Controls.Add($logPanel)

# Buttons Panel
$buttonsPanel = New-Object System.Windows.Forms.Panel
$buttonsPanel.Location = New-Object System.Drawing.Point(40, 570)
$buttonsPanel.Size = New-Object System.Drawing.Size(1000, 60)
$buttonsPanel.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)

$startButton = New-Object System.Windows.Forms.Button
$startButton.Text = 'START SYSTEM'
$startButton.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$startButton.BackColor = [System.Drawing.Color]::Green
$startButton.ForeColor = [System.Drawing.Color]::White
$startButton.FlatStyle = 'Flat'
$startButton.Location = New-Object System.Drawing.Point(0, 5)
$startButton.Size = New-Object System.Drawing.Size(240, 50)
$buttonsPanel.Controls.Add($startButton)

$stopButton = New-Object System.Windows.Forms.Button
$stopButton.Text = 'STOP SYSTEM'
$stopButton.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$stopButton.BackColor = [System.Drawing.Color]::Red
$stopButton.ForeColor = [System.Drawing.Color]::White
$stopButton.FlatStyle = 'Flat'
$stopButton.Location = New-Object System.Drawing.Point(260, 5)
$stopButton.Size = New-Object System.Drawing.Size(200, 50)
$stopButton.Enabled = $false
$buttonsPanel.Controls.Add($stopButton)

$copyUrlButton = New-Object System.Windows.Forms.Button
$copyUrlButton.Text = 'COPY SHARE URL'
$copyUrlButton.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$copyUrlButton.BackColor = [System.Drawing.Color]::FromArgb(59, 130, 246)
$copyUrlButton.ForeColor = [System.Drawing.Color]::White
$copyUrlButton.FlatStyle = 'Flat'
$copyUrlButton.Location = New-Object System.Drawing.Point(480, 5)
$copyUrlButton.Size = New-Object System.Drawing.Size(200, 50)
$copyUrlButton.Enabled = $false
$buttonsPanel.Controls.Add($copyUrlButton)

$exitButton = New-Object System.Windows.Forms.Button
$exitButton.Text = 'EXIT'
$exitButton.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$exitButton.BackColor = [System.Drawing.Color]::Gray
$exitButton.ForeColor = [System.Drawing.Color]::White
$exitButton.FlatStyle = 'Flat'
$exitButton.Location = New-Object System.Drawing.Point(820, 5)
$exitButton.Size = New-Object System.Drawing.Size(180, 50)
$buttonsPanel.Controls.Add($exitButton)

$form.Controls.Add($buttonsPanel)

# Functions
function Add-Log {
    param([string]$message)
    $timestamp = Get-Date -Format 'HH:mm:ss'
    $logTextBox.AppendText("[$timestamp] $message`r`n")
    $logTextBox.ScrollToCaret()
    [System.Windows.Forms.Application]::DoEvents()
}

# Cloudflare Tunnel Functions
function Check-Cloudflared {
    try {
        $cfPath = Get-Command cloudflared -ErrorAction SilentlyContinue
        if ($cfPath) {
            return $cfPath.Source
        }
        # Check common install locations
        $paths = @(
            "$env:USERPROFILE\cloudflared\cloudflared.exe",
            "$env:ProgramFiles\Cloudflare\cloudflared.exe",
            "$env:LOCALAPPDATA\Programs\cloudflared\cloudflared.exe",
            "C:\cloudflared\cloudflared.exe"
        )
        foreach ($p in $paths) {
            if (Test-Path $p) {
                return $p
            }
        }
        return $null
    } catch {
        return $null
    }
}

function Install-Cloudflared {
    Add-Log "Installing Cloudflare Tunnel (cloudflared)..."
    try {
        # Download cloudflared for Windows
        $downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        $installPath = "$env:USERPROFILE\cloudflared"
        $exePath = "$installPath\cloudflared.exe"
        
        # Create directory
        if (-not (Test-Path $installPath)) {
            New-Item -ItemType Directory -Path $installPath -Force | Out-Null
        }
        
        Add-Log "Downloading cloudflared from GitHub..."
        Add-Log "This may take a moment..."
        
        # Download with progress
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($downloadUrl, $exePath)
        
        if (Test-Path $exePath) {
            # Add to PATH for current session
            $env:PATH = "$installPath;$env:PATH"
            Add-Log "Cloudflared installed successfully!"
            Add-Log "Location: $exePath"
            return $exePath
        } else {
            Add-Log "ERROR: Download failed"
            return $null
        }
    } catch {
        Add-Log "ERROR: Failed to install cloudflared - $($_.Exception.Message)"
        return $null
    }
}

function Start-CloudflareTunnel {
    param([int]$port, [string]$name, [string]$cloudflaredPath)
    
    Add-Log "Starting Cloudflare tunnel for $name on port $port..."
    
    # Create temp files for output redirection
    $tempOut = "$env:TEMP\cloudflared_${name}_stdout.log"
    $tempErr = "$env:TEMP\cloudflared_${name}_stderr.log"
    Remove-Item $tempOut, $tempErr -Force -ErrorAction SilentlyContinue
    
    # Start cloudflared with output redirection
    $cfProcess = Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel","--url","http://localhost:$port" -RedirectStandardOutput $tempOut -RedirectStandardError $tempErr -PassThru -WindowStyle Hidden
    $script:tunnelProcesses += $cfProcess
    
    # Wait for URL (cloudflared outputs to stderr)
    $tunnelUrl = ""
    $maxAttempts = 60  # 30 seconds max
    $attempt = 0
    
    Add-Log "Waiting for Cloudflare tunnel to establish..."
    
    while ($attempt -lt $maxAttempts -and $tunnelUrl -eq "") {
        Start-Sleep -Milliseconds 500
        
        # Read from stderr file where cloudflared writes
        if (Test-Path $tempErr) {
            try {
                $content = Get-Content $tempErr -Raw -ErrorAction SilentlyContinue
                if ($content) {
                    # Look for the tunnel URL pattern
                    if ($content -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
                        $tunnelUrl = $Matches[1]
                    }
                }
            } catch {
                # Ignore read errors - file might be locked
            }
        }
        
        $attempt++
        
        # Show progress every 2 seconds
        if ($attempt % 4 -eq 0 -and $tunnelUrl -eq "") {
            Add-Log "Still connecting... ($([math]::Round($attempt/2))s)"
        }
    }
    
    if ($tunnelUrl -ne "") {
        Add-Log "$name tunnel ready: $tunnelUrl"
        return $tunnelUrl
    } else {
        Add-Log "WARNING: Could not get Cloudflare tunnel URL for $name"
        
        # Try to read error from file
        if (Test-Path $tempErr) {
            $content = Get-Content $tempErr -Raw -ErrorAction SilentlyContinue
            if ($content) {
                Add-Log "Cloudflared output: $($content.Substring(0, [Math]::Min(300, $content.Length)))..."
            }
        }
        return ""
    }
}

function Stop-Tunnels {
    Add-Log "Stopping tunnels..."
    foreach ($process in $script:tunnelProcesses) {
        if ($process -and -not $process.HasExited) {
            try { 
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue 
            } catch {}
        }
    }
    $script:tunnelProcesses = @()
    
    # Also kill any cloudflared processes
    try {
        Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    } catch {}
    
    $script:backendTunnelUrl = ""
    $script:frontendTunnelUrl = ""
    $script:shareUrlFull = ""
    $tunnelUrlLabel.Text = ""
    $copyUrlButton.Enabled = $false
}

$script:tunnelPassword = ""

function Check-And-Kill-Port {
    param([int]$port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            if ($conn.State -eq "Listen") {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                if ($process) {
                    Add-Log "Killing process $($process.Name) (PID: $($process.Id)) using port $port"
                    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {
        # NetTCPConnection might not be available on older Windows versions
        try {
            $output = netstat -ano | findstr ":$port "
            if ($output) {
                $parts = $output -split '\s+'
                $processId = $parts[$parts.Length - 1]
                if ($processId -and $processId -ne "0") {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Add-Log "Killing process $($process.Name) (PID: $processId) using port $port"
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    }
                }
            }
        } catch {
            Add-Log "Warning: Could not check port $port"
        }
    }
}

function Start-Servers {
    param([int]$clientCount, [bool]$demoMode)
    $script:isRunning = $true
    $script:isDemoMode = $demoMode
    $startButton.Enabled = $false
    $stopButton.Enabled = $true
    $demoCheckbox.Enabled = $false
    $statusLabel.Text = 'Status: Starting...'
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow

    # Check Cloudflare Tunnel if demo mode enabled
    if ($demoMode) {
        Add-Log '=== DEMO MODE ENABLED - Remote Access ==='
        Add-Log 'Using Cloudflare Tunnel (Fast & No Password Required!)'
        
        $cloudflaredPath = Check-Cloudflared
        if (-not $cloudflaredPath) {
            Add-Log 'Cloudflared not found. Installing...'
            $cloudflaredPath = Install-Cloudflared
            if (-not $cloudflaredPath) {
                Add-Log 'ERROR: Cannot install Cloudflared. Continuing without demo mode.'
                $script:isDemoMode = $false
            }
        } else {
            Add-Log "Cloudflared found: $cloudflaredPath"
        }
    }

    Add-Log 'Checking and cleaning up ports...'
    # Check and kill processes using ports 3000-3010 (for frontend clients)
    for ($i = 0; $i -lt 11; $i++) {
        $port = 3000 + $i
        Check-And-Kill-Port -port $port
    }

    # Check backend port
    Check-And-Kill-Port -port 5000

    Add-Log 'Cleaning up any remaining Node.js processes...'
    # Kill any existing node.exe processes that might be using ports
    try {
        $existingNodes = Get-Process -Name "node" -ErrorAction SilentlyContinue
        foreach ($node in $existingNodes) {
            if ($node.MainModule.FileName -like "*next*" -or $node.MainModule.FileName -like "*frontend*" -or $node.MainModule.FileName -like "*backend*") {
                Add-Log "Stopping existing Node.js process (PID: $($node.Id))"
                Stop-Process -Id $node.Id -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        Add-Log "Warning: Could not clean up existing processes"
    }

    Add-Log 'Starting Backend...'
    $backendScript = "$projectPath\scripts\run_backend.bat"
    $script:backendProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "`"$backendScript`"" -PassThru -WindowStyle Normal
    Start-Sleep -Seconds 5

    Add-Log 'Starting Frontend...'
    Add-Log "Client count: $clientCount"
    if ($clientCount -eq 1) {
        # Single client - use original script
        Add-Log 'Using single client mode'
        $frontendScript = "$projectPath\scripts\run_frontend.bat"
        $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "`"$frontendScript`"" -PassThru -WindowStyle Normal
        $script:frontendProcesses += $process
        Add-Log "Single client on port 3000"
    } else {
        # Multiple clients - use new multi-client launcher (no more copying folders!)
        Add-Log "Starting $clientCount clients using multi-client launcher..."
        Add-Log "All clients share same source code - no folder duplication"
        
        # Use new PowerShell-based multi-client script
        $multiClientScript = "$projectPath\scripts\run_multi_client.ps1"
        $process = Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "`"$multiClientScript`"", "-ClientCount", $clientCount -PassThru -WindowStyle Normal
        $script:frontendProcesses += $process

        # Log client URLs
        for ($i = 1; $i -le $clientCount; $i++) {
            $port = 3000 + $i - 1
            Add-Log ("Client $i`: http://localhost:" + $port)
        }
    }
    
    # Start tunnels if demo mode enabled
    if ($script:isDemoMode) {
        Add-Log ''
        Add-Log '=== Starting Cloudflare Tunnels ==='
        
        $cloudflaredPath = Check-Cloudflared
        if ($cloudflaredPath) {
            Start-Sleep -Seconds 2
            
            # Start backend tunnel
            $script:backendTunnelUrl = Start-CloudflareTunnel -port 5000 -name "Backend API" -cloudflaredPath $cloudflaredPath
            
            Start-Sleep -Seconds 1
            
            # Start frontend tunnel
            $script:frontendTunnelUrl = Start-CloudflareTunnel -port 3000 -name "Frontend" -cloudflaredPath $cloudflaredPath
            
            $script:tunnelPassword = "NOT REQUIRED"
            
            if ($script:frontendTunnelUrl -ne "") {
                # Create share URL with backend parameter
                $shareUrl = $script:frontendTunnelUrl
                if ($script:backendTunnelUrl -ne "") {
                    $encodedBackend = [System.Web.HttpUtility]::UrlEncode("$($script:backendTunnelUrl)/api")
                    $shareUrl = "$($script:frontendTunnelUrl)?backend=$encodedBackend"
                }
                $script:shareUrlFull = $shareUrl
                
                $tunnelUrlLabel.Text = "URL: $($script:frontendTunnelUrl)  |  NO PASSWORD NEEDED!"
                $tunnelUrlLabel.ForeColor = [System.Drawing.Color]::FromArgb(34, 197, 94)
                $copyUrlButton.Enabled = $true
                
                Add-Log ''
                Add-Log '=========================================='
                Add-Log '  CLOUDFLARE TUNNEL READY!'
                Add-Log '=========================================='
                Add-Log ''
                Add-Log "FRONTEND: $($script:frontendTunnelUrl)"
                Add-Log "BACKEND:  $($script:backendTunnelUrl)"
                Add-Log ''
                Add-Log 'NO PASSWORD REQUIRED!'
                Add-Log ''
                Add-Log '*** SHARE THIS LINK: ***'
                Add-Log "$shareUrl"
                Add-Log ''
                Add-Log 'Just send the link - instant access!'
                Add-Log '=========================================='
            } else {
                Add-Log 'WARNING: Tunnels may not have started properly'
                Add-Log 'Try stopping and starting again'
            }
        }
    }
    
    $statusLabel.Text = 'Status: Running'
    $statusLabel.ForeColor = [System.Drawing.Color]::Lime
    Add-Log 'Startup completed successfully!'
}

function Stop-Servers {
    if (-not $script:isRunning) { return }

    Add-Log 'Stopping servers...'

    # Stop tunnels first
    if ($script:isDemoMode) {
        Stop-Tunnels
    }

    foreach ($process in $script:frontendProcesses) {
        if ($process -and -not $process.HasExited) {
            try { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
    $script:frontendProcesses = @()

    if ($script:backendProcess -and -not $script:backendProcess.HasExited) {
        try { Stop-Process -Id $script:backendProcess.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
    $script:backendProcess = $null

    $script:isRunning = $false
    $script:isDemoMode = $false
    $startButton.Enabled = $true
    $stopButton.Enabled = $false
    $demoCheckbox.Enabled = $true
    $copyUrlButton.Enabled = $false
    $tunnelUrlLabel.Text = ""
    $statusLabel.Text = 'Status: Stopped'
    $statusLabel.ForeColor = [System.Drawing.Color]::Red
    Add-Log 'All servers stopped'
}

# Events
$checkPortsButton.Add_Click({
    Add-Log 'Checking port usage...'
    for ($i = 0; $i -lt 11; $i++) {
        $port = 3000 + $i
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            $listening = $false
            foreach ($conn in $connections) {
                if ($conn.State -eq "Listen") {
                    $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                    $processName = if ($process) { $process.Name } else { "Unknown" }
                    Add-Log "Port $port is in use by $processName (PID: $($conn.OwningProcess))"
                    $listening = $true
                }
            }
            if (-not $listening) {
                Add-Log "Port $port is available"
            }
        } catch {
            try {
                $output = netstat -ano | findstr ":$port "
                if ($output) {
                    Add-Log "Port $port appears to be in use"
                } else {
                    Add-Log "Port $port is available"
                }
            } catch {
                Add-Log "Cannot check port $port"
            }
        }
    }

    # Check backend port
    try {
        $connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
        $listening = $false
        foreach ($conn in $connections) {
            if ($conn.State -eq "Listen") {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                $processName = if ($process) { $process.Name } else { "Unknown" }
                Add-Log "Port 5000 is in use by $processName (PID: $($conn.OwningProcess))"
                $listening = $true
            }
        }
        if (-not $listening) {
            Add-Log "Port 5000 is available"
        }
    } catch {
        try {
            $output = netstat -ano | findstr ":5000 "
            if ($output) {
                Add-Log "Port 5000 appears to be in use"
            } else {
                Add-Log "Port 5000 is available"
            }
        } catch {
            Add-Log "Cannot check port 5000"
        }
    }
})

$killPortsButton.Add_Click({
    Add-Log 'Killing processes on used ports...'
    # Kill processes using frontend ports
    for ($i = 0; $i -lt 11; $i++) {
        $port = 3000 + $i
        Check-And-Kill-Port -port $port
    }
    # Kill backend port
    Check-And-Kill-Port -port 5000
    Add-Log 'Port cleanup completed'
})

$startButton.Add_Click({
    $clientCount = [int]$clientNumeric.Value
    $demoMode = $demoCheckbox.Checked
    Start-Servers -clientCount $clientCount -demoMode $demoMode
})

$stopButton.Add_Click({ Stop-Servers })

$copyUrlButton.Add_Click({
    if ($script:shareUrlFull -ne "") {
        $shareText = @"
===== VieGo Blog Demo =====

FRONTEND URL: $($script:frontendTunnelUrl)
BACKEND URL:  $($script:backendTunnelUrl)

NO PASSWORD REQUIRED! (Cloudflare Tunnel)

=== HOW TO ACCESS ===
1. Click the SHARE LINK below
2. Website loads instantly!

=== SHARE LINK ===
$($script:shareUrlFull)
"@
        [System.Windows.Forms.Clipboard]::SetText($shareText)
        Add-Log "Share info copied to clipboard!"
        [System.Windows.Forms.MessageBox]::Show("Share URL copied!`n`nJust send this link:`n$($script:shareUrlFull)`n`nNO PASSWORD NEEDED!`n`nPowered by Cloudflare Tunnel", "Copied!", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    }
})

$exitButton.Add_Click({
    if ($script:isRunning) { Stop-Servers }
    $form.Close()
})

$form.Add_FormClosing({
    if ($script:isRunning) { Stop-Servers }
})

Add-Log 'VieGo Blog Launcher'
Add-Log 'Ready to start...'

[System.Windows.Forms.Application]::EnableVisualStyles()
$form.ShowDialog() | Out-Null
