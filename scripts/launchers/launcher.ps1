# VieGo Blog Launcher - Simple Version
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$script:backendProcess = $null
$script:frontendProcesses = @()
$script:isRunning = $false
$script:projectPath = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))

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
$statusLabel.Location = New-Object System.Drawing.Point(30, 25)
$statusLabel.AutoSize = $true
$statusPanel.Controls.Add($statusLabel)

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
$stopButton.Size = New-Object System.Drawing.Size(240, 50)
$stopButton.Enabled = $false
$buttonsPanel.Controls.Add($stopButton)

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
    param([int]$clientCount)
    $script:isRunning = $true
    $startButton.Enabled = $false
    $stopButton.Enabled = $true
    $statusLabel.Text = 'Status: Starting...'
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow

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
    
    $statusLabel.Text = 'Status: Running'
    $statusLabel.ForeColor = [System.Drawing.Color]::Lime
    Add-Log 'Startup completed successfully!'
}

function Stop-Servers {
    if (-not $script:isRunning) { return }

    Add-Log 'Stopping servers...'

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
    $startButton.Enabled = $true
    $stopButton.Enabled = $false
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
    Start-Servers -clientCount $clientCount
})

$stopButton.Add_Click({ Stop-Servers })

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
