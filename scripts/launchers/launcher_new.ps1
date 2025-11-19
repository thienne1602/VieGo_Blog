# VieGo Blog Launcher - Simple Version
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$script:backendProcess = $null
$script:frontendProcesses = @()
$script:isRunning = $false
$script:projectPath = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

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
$configPanel.Size = New-Object System.Drawing.Size(1000, 90)
$configPanel.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85)

$clientLabel = New-Object System.Windows.Forms.Label
$clientLabel.Text = 'So luong Frontend Clients:'
$clientLabel.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
$clientLabel.ForeColor = [System.Drawing.Color]::White
$clientLabel.Location = New-Object System.Drawing.Point(30, 30)
$clientLabel.AutoSize = $true
$configPanel.Controls.Add($clientLabel)

$clientNumeric = New-Object System.Windows.Forms.NumericUpDown
$clientNumeric.Minimum = 1
$clientNumeric.Maximum = 10
$clientNumeric.Value = 1
$clientNumeric.Font = New-Object System.Drawing.Font('Segoe UI', 14)
$clientNumeric.Location = New-Object System.Drawing.Point(350, 27)
$clientNumeric.Size = New-Object System.Drawing.Size(100, 35)
$configPanel.Controls.Add($clientNumeric)

$form.Controls.Add($configPanel)

# Status Panel
$statusPanel = New-Object System.Windows.Forms.Panel
$statusPanel.Location = New-Object System.Drawing.Point(40, 230)
$statusPanel.Size = New-Object System.Drawing.Size(1000, 70)
$statusPanel.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = 'Trang thai: Chua khoi dong'
$statusLabel.Font = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::Gray
$statusLabel.Location = New-Object System.Drawing.Point(30, 25)
$statusLabel.AutoSize = $true
$statusPanel.Controls.Add($statusLabel)

$form.Controls.Add($statusPanel)

# Log Panel
$logPanel = New-Object System.Windows.Forms.Panel
$logPanel.Location = New-Object System.Drawing.Point(40, 320)
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
$buttonsPanel.Location = New-Object System.Drawing.Point(40, 540)
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

function Start-Servers {
    param([int]$clientCount)
    $script:isRunning = $true
    $startButton.Enabled = $false
    $stopButton.Enabled = $true
    $statusLabel.Text = 'Trang thai: Dang khoi dong...'
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    
    Add-Log 'Khoi dong Backend...'
    $backendScript = "$projectPath\scripts\run_backend.bat"
    $script:backendProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "`"$backendScript`"" -PassThru -WindowStyle Normal
    Start-Sleep -Seconds 5
    
    Add-Log 'Khoi dong Frontend...'
    for ($i = 1; $i -le $clientCount; $i++) {
        $port = 3000 + $i - 1
        if ($i -eq 1 -and $clientCount -eq 1) {
            $frontendScript = "$projectPath\scripts\run_frontend.bat"
            $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "`"$frontendScript`"" -PassThru -WindowStyle Normal
        } else {
            $frontendScript = "$projectPath\run_frontend_port.bat"
            $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "`"$frontendScript`" $port" -PassThru -WindowStyle Normal
        }
        $script:frontendProcesses += $process
        Add-Log "Client $i on port $port"
        Start-Sleep -Seconds 3
    }
    
    $statusLabel.Text = 'Trang thai: Dang chay'
    $statusLabel.ForeColor = [System.Drawing.Color]::Lime
    Add-Log 'Khoi dong thanh cong!'
}

function Stop-Servers {
    if (-not $script:isRunning) { return }
    
    Add-Log 'Dang dung servers...'
    
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
    $statusLabel.Text = 'Trang thai: Da dung'
    $statusLabel.ForeColor = [System.Drawing.Color]::Red
    Add-Log 'Da dung tat ca servers'
}

# Events
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
Add-Log 'San sang khoi dong...'

[System.Windows.Forms.Application]::EnableVisualStyles()
$form.ShowDialog() | Out-Null
