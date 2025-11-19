# VieGo Blog - Simple Launcher
# Modern GUI Application for Running Client and Server
# Encoding: UTF-8

# Set UTF-8 encoding
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Continue'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Global variables
$script:backendProcess = $null
$script:frontendProcesses = @()
$script:isRunning = $false
$script:projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# ============================================
# CREATE MAIN FORM
# ============================================
$form = New-Object System.Windows.Forms.Form
$form.Text = "🚀 VieGo Blog - System Launcher"
$form.Size = New-Object System.Drawing.Size(1100, 680)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $true
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)

# ============================================
# TITLE PANEL
# ============================================
$titlePanel = New-Object System.Windows.Forms.Panel
$titlePanel.Location = New-Object System.Drawing.Point(0, 0)
$titlePanel.Size = New-Object System.Drawing.Size(1100, 100)
$titlePanel.BackColor = [System.Drawing.Color]::FromArgb(79, 70, 229)

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "🚀 VIEGO BLOG LAUNCHER"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::White
$titleLabel.AutoSize = $true
$titleLabel.Location = New-Object System.Drawing.Point(30, 25)
$titleLabel.BackColor = [System.Drawing.Color]::Transparent
$titlePanel.Controls.Add($titleLabel)

$subtitleLabel = New-Object System.Windows.Forms.Label
$subtitleLabel.Text = "⚡ Professional Development Environment"
$subtitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11)
$subtitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 220, 255)
$subtitleLabel.AutoSize = $true
$subtitleLabel.Location = New-Object System.Drawing.Point(30, 65)
$subtitleLabel.BackColor = [System.Drawing.Color]::Transparent
$titlePanel.Controls.Add($subtitleLabel)

$form.Controls.Add($titlePanel)

# ============================================
# CONFIG PANEL
# ============================================
$configPanel = New-Object System.Windows.Forms.Panel
$configPanel.Location = New-Object System.Drawing.Point(40, 120)
$configPanel.Size = New-Object System.Drawing.Size(1000, 90)
$configPanel.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85)

$clientLabel = New-Object System.Windows.Forms.Label
$clientLabel.Text = "📊 Số lượng Frontend Clients:"
$clientLabel.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$clientLabel.ForeColor = [System.Drawing.Color]::White
$clientLabel.AutoSize = $true
$clientLabel.Location = New-Object System.Drawing.Point(30, 25)
$configPanel.Controls.Add($clientLabel)

$clientNumeric = New-Object System.Windows.Forms.NumericUpDown
$clientNumeric.Minimum = 1
$clientNumeric.Maximum = 10
$clientNumeric.Value = 1
$clientNumeric.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$clientNumeric.Size = New-Object System.Drawing.Size(100, 35)
$clientNumeric.Location = New-Object System.Drawing.Point(350, 22)
$clientNumeric.BackColor = [System.Drawing.Color]::FromArgb(71, 85, 105)
$clientNumeric.ForeColor = [System.Drawing.Color]::White
$configPanel.Controls.Add($clientNumeric)

$infoLabel = New-Object System.Windows.Forms.Label
$infoLabel.Text = "💡 Chọn từ 1-10 instances để chạy đồng thời"
$infoLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Italic)
$infoLabel.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 220)
$infoLabel.AutoSize = $true
$infoLabel.Location = New-Object System.Drawing.Point(30, 60)
$configPanel.Controls.Add($infoLabel)

$form.Controls.Add($configPanel)

# ============================================
# STATUS PANEL
# ============================================
$statusPanel = New-Object System.Windows.Forms.Panel
$statusPanel.Location = New-Object System.Drawing.Point(40, 230)
$statusPanel.Size = New-Object System.Drawing.Size(1000, 70)
$statusPanel.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "⚪ Trạng thái: Chưa khởi động"
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(156, 163, 175)
$statusLabel.AutoSize = $true
$statusLabel.Location = New-Object System.Drawing.Point(30, 25)
$statusPanel.Controls.Add($statusLabel)

$form.Controls.Add($statusPanel)

# ============================================
# LOG PANEL
# ============================================
$logPanel = New-Object System.Windows.Forms.Panel
$logPanel.Location = New-Object System.Drawing.Point(40, 320)
$logPanel.Size = New-Object System.Drawing.Size(1000, 180)
$logPanel.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85)

$logTitleLabel = New-Object System.Windows.Forms.Label
$logTitleLabel.Text = "📋 System Logs"
$logTitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$logTitleLabel.ForeColor = [System.Drawing.Color]::White
$logTitleLabel.AutoSize = $true
$logTitleLabel.Location = New-Object System.Drawing.Point(20, 10)
$logPanel.Controls.Add($logTitleLabel)

$logTextBox = New-Object System.Windows.Forms.RichTextBox
$logTextBox.Location = New-Object System.Drawing.Point(20, 40)
$logTextBox.Size = New-Object System.Drawing.Size(960, 130)
$logTextBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$logTextBox.ReadOnly = $true
$logTextBox.BackColor = [System.Drawing.Color]::FromArgb(17, 24, 39)
$logTextBox.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
$logPanel.Controls.Add($logTextBox)

$form.Controls.Add($logPanel)

# ============================================
# URLS PANEL
# ============================================
$urlsPanel = New-Object System.Windows.Forms.Panel
$urlsPanel.Location = New-Object System.Drawing.Point(40, 520)
$urlsPanel.Size = New-Object System.Drawing.Size(1000, 45)
$urlsPanel.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85)

$urlsLabel = New-Object System.Windows.Forms.Label
$urlsLabel.Text = "🔗 URLs sẽ hiển thị sau khi khởi động"
$urlsLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$urlsLabel.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 220)
$urlsLabel.AutoSize = $true
$urlsLabel.Location = New-Object System.Drawing.Point(20, 15)
$urlsPanel.Controls.Add($urlsLabel)

$form.Controls.Add($urlsPanel)

# ============================================
# BUTTONS PANEL
# ============================================
$buttonsPanel = New-Object System.Windows.Forms.Panel
$buttonsPanel.Location = New-Object System.Drawing.Point(40, 580)
$buttonsPanel.Size = New-Object System.Drawing.Size(1000, 60)
$buttonsPanel.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)

$startButton = New-Object System.Windows.Forms.Button
$startButton.Text = "▶️ START SYSTEM"
$startButton.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$startButton.BackColor = [System.Drawing.Color]::FromArgb(16, 185, 129)
$startButton.ForeColor = [System.Drawing.Color]::White
$startButton.FlatStyle = "Flat"
$startButton.Size = New-Object System.Drawing.Size(240, 50)
$startButton.Location = New-Object System.Drawing.Point(0, 5)
$startButton.Cursor = [System.Windows.Forms.Cursors]::Hand
$buttonsPanel.Controls.Add($startButton)

$stopButton = New-Object System.Windows.Forms.Button
$stopButton.Text = "⏹️ STOP SYSTEM"
$stopButton.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$stopButton.BackColor = [System.Drawing.Color]::FromArgb(239, 68, 68)
$stopButton.ForeColor = [System.Drawing.Color]::White
$stopButton.FlatStyle = "Flat"
$stopButton.Size = New-Object System.Drawing.Size(240, 50)
$stopButton.Location = New-Object System.Drawing.Point(260, 5)
$stopButton.Enabled = $false
$stopButton.Cursor = [System.Windows.Forms.Cursors]::Hand
$buttonsPanel.Controls.Add($stopButton)

$exitButton = New-Object System.Windows.Forms.Button
$exitButton.Text = "❌ EXIT"
$exitButton.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$exitButton.BackColor = [System.Drawing.Color]::FromArgb(107, 114, 128)
$exitButton.ForeColor = [System.Drawing.Color]::White
$exitButton.FlatStyle = "Flat"
$exitButton.Size = New-Object System.Drawing.Size(180, 50)
$exitButton.Location = New-Object System.Drawing.Point(820, 5)
$exitButton.Cursor = [System.Windows.Forms.Cursors]::Hand
$buttonsPanel.Controls.Add($exitButton)

$form.Controls.Add($buttonsPanel)

# ============================================
# FUNCTIONS
# ============================================
function Add-Log {
    param([string]$message, [string]$color = "LightGreen")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $logTextBox.SelectionStart = $logTextBox.TextLength
    $logTextBox.SelectionLength = 0
    
    switch ($color) {
        "Green" { $logTextBox.SelectionColor = [System.Drawing.Color]::FromArgb(52, 211, 153) }
        "Yellow" { $logTextBox.SelectionColor = [System.Drawing.Color]::FromArgb(251, 191, 36) }
        "Red" { $logTextBox.SelectionColor = [System.Drawing.Color]::FromArgb(239, 68, 68) }
        "Cyan" { $logTextBox.SelectionColor = [System.Drawing.Color]::FromArgb(34, 211, 238) }
        default { $logTextBox.SelectionColor = [System.Drawing.Color]::FromArgb(52, 211, 153) }
    }
    
    $logTextBox.AppendText("[$timestamp] $message`r`n")
    $logTextBox.ScrollToCaret()
    [System.Windows.Forms.Application]::DoEvents()
}

function Check-Prerequisites {
    Add-Log "📋 Đang kiểm tra hệ thống..." "Yellow"
    
    $nodePath = "C:\laragon\bin\nodejs\node-v20\node.exe"
    if (-not (Test-Path $nodePath)) {
        Add-Log "❌ Node.js v20 không tìm thấy" "Red"
        return $false
    }
    $nodeVersion = & $nodePath --version
    Add-Log "✅ Node.js: $nodeVersion" "Green"
    
    $mysqlPath = "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe"
    if (-not (Test-Path $mysqlPath)) {
        Add-Log "❌ MySQL không tìm thấy" "Red"
        return $false
    }
    
    try {
        & $mysqlPath -u root -e "SELECT 1" 2>$null | Out-Null
        Add-Log "✅ MySQL đã kết nối" "Green"
    } catch {
        Add-Log "❌ Không thể kết nối MySQL!" "Red"
        return $false
    }
    
    try {
        & $mysqlPath -u root -e "USE viego_blog; SELECT COUNT(*) FROM users;" 2>$null | Out-Null
        Add-Log "✅ Database 'viego_blog' OK" "Green"
    } catch {
        Add-Log "⚠️  Database chưa có dữ liệu!" "Yellow"
    }
    
    if (-not (Test-Path "$projectPath\.venv_new\Scripts\activate.bat")) {
        Add-Log "❌ Virtual environment không tồn tại!" "Red"
        return $false
    }
    Add-Log "✅ Virtual environment OK" "Green"
    
    return $true
}

function Update-URLs {
    param([int]$clientCount)
    
    $urlsPanel.Controls.Clear()
    
    $urlText = "🔧 Backend: http://localhost:5000"
    
    for ($i = 1; $i -le $clientCount; $i++) {
        $port = 3000 + $i - 1
        if ($clientCount -eq 1) {
            $urlText += "  |  🌐 Frontend: http://localhost:$port"
        } else {
            $urlText += "  |  🌐 Client $i : http://localhost:$port"
        }
    }
    
    $urlsLabel = New-Object System.Windows.Forms.Label
    $urlsLabel.Text = $urlText
    $urlsLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10)
    $urlsLabel.ForeColor = [System.Drawing.Color]::FromArgb(96, 165, 250)
    $urlsLabel.AutoSize = $true
    $urlsLabel.Location = New-Object System.Drawing.Point(20, 5)
    $urlsPanel.Controls.Add($urlsLabel)
    
    $loginLabel = New-Object System.Windows.Forms.Label
    $loginLabel.Text = "🔑 Login: admin@viego.com / Admin@123  |  vana@gmail.com / User@123"
    $loginLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Italic)
    $loginLabel.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 220)
    $loginLabel.AutoSize = $true
    $loginLabel.Location = New-Object System.Drawing.Point(20, 25)
    $urlsPanel.Controls.Add($loginLabel)
}

function Start-Servers {
    param([int]$clientCount)
    
    if ($script:isRunning) {
        Add-Log "⚠️  Hệ thống đang chạy!" "Yellow"
        return
    }
    
    if (-not (Check-Prerequisites)) {
        Add-Log "❌ Kiểm tra hệ thống thất bại!" "Red"
        $statusLabel.Text = "🔴 Trạng thái: Lỗi"
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(239, 68, 68)
        return
    }
    
    $script:isRunning = $true
    $startButton.Enabled = $false
    $stopButton.Enabled = $true
    $clientNumeric.Enabled = $false
    $statusLabel.Text = "🟡 Trạng thái: Đang khởi động..."
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(245, 158, 11)
    
    Add-Log "🚀 Đang khởi động hệ thống..." "Cyan"
    Add-Log "📊 Backend (1) + Frontend ($clientCount)" "Cyan"
    
    Add-Log "🔧 Khởi động Backend..." "Yellow"
    $backendScript = "$projectPath\run_backend.bat"
    $script:backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "`"$backendScript`"" -PassThru -WindowStyle Normal
    
    Add-Log "⏳ Đợi Backend khởi động..." "Yellow"
    Start-Sleep -Seconds 5
    
    Add-Log "🌐 Khởi động Frontend..." "Yellow"
    $startPort = 3000
    
    for ($i = 1; $i -le $clientCount; $i++) {
        $port = $startPort + $i - 1
        if ($i -eq 1 -and $clientCount -eq 1) {
            $frontendScript = "$projectPath\run_frontend.bat"
            $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "`"$frontendScript`"" -PassThru -WindowStyle Normal
        } else {
            $frontendScript = "$projectPath\run_frontend_port.bat"
            $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "`"$frontendScript`" $port" -PassThru -WindowStyle Normal
        }
        $script:frontendProcesses += $process
        Add-Log "   ✅ Client $i: port $port" "Green"
        Start-Sleep -Seconds 3
    }
    
    Update-URLs -clientCount $clientCount
    
    $statusLabel.Text = "🟢 Trạng thái: Đang chạy"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
    Add-Log "✅ Khởi động thành công!" "Green"
}

function Stop-Servers {
    if (-not $script:isRunning) {
        return
    }
    
    Add-Log "⏹️  Đang dừng servers..." "Yellow"
    
    foreach ($process in $script:frontendProcesses) {
        if ($process -and -not $process.HasExited) {
            try {
                Get-Process -Id $process.Id -ErrorAction SilentlyContinue | 
                    ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
            } catch {}
        }
    }
    $script:frontendProcesses = @()
    
    if ($script:backendProcess -and -not $script:backendProcess.HasExited) {
        try {
            Get-Process -Id $script:backendProcess.Id -ErrorAction SilentlyContinue | 
                ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
        } catch {}
    }
    $script:backendProcess = $null
    
    $script:isRunning = $false
    $startButton.Enabled = $true
    $stopButton.Enabled = $false
    $clientNumeric.Enabled = $true
    $statusLabel.Text = "🔴 Trạng thái: Đã dừng"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(239, 68, 68)
    
    Add-Log "✅ Đã dừng tất cả servers" "Green"
}

# ============================================
# EVENT HANDLERS
# ============================================
$startButton.Add_Click({
    $clientCount = [int]$clientNumeric.Value
    Start-Servers -clientCount $clientCount
})

$stopButton.Add_Click({
    Stop-Servers
})

$exitButton.Add_Click({
    if ($script:isRunning) {
        $result = [System.Windows.Forms.MessageBox]::Show(
            "Hệ thống đang chạy. Dừng trước khi thoát?",
            "Xác nhận",
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Question
        )
        if ($result -eq "Yes") {
            Stop-Servers
        }
    }
    $form.Close()
})

$form.Add_FormClosing({
    if ($script:isRunning) {
        Stop-Servers
    }
})

# ============================================
# INITIALIZE
# ============================================
Add-Log "🚀 VieGo Blog System Launcher" "Cyan"
Add-Log "Sẵn sàng khởi động..." "Green"
Update-URLs -clientCount 1

# ============================================
# SHOW FORM
# ============================================
[System.Windows.Forms.Application]::EnableVisualStyles()
$form.ShowDialog() | Out-Null
