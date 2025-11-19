# VieGo Blog - Full Stack Launcher
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
$script:projectPath = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))

# ============================================
# CREATE MAIN FORM
# ============================================
$form = New-Object System.Windows.Forms.Form
$form.Text = "🚀 VieGo Blog - System Launcher"
$form.Size = New-Object System.Drawing.Size(1200, 750)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $true
$form.BackColor = [System.Drawing.Color]::FromArgb(17, 24, 39)
$form.Padding = New-Object System.Windows.Forms.Padding(0)

# ============================================
# TITLE PANEL (Top - Modern Gradient)
# ============================================
$titlePanel = New-Object System.Windows.Forms.Panel
$titlePanel.Dock = [System.Windows.Forms.DockStyle]::Top
$titlePanel.Height = 140
$titlePanel.BackColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
$titlePanel.Paint += {
    param($sender, $e)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($sender.Width, $sender.Height),
        [System.Drawing.Color]::FromArgb(79, 70, 229),
        [System.Drawing.Color]::FromArgb(124, 58, 237)
    )
    $e.Graphics.FillRectangle($brush, 0, 0, $sender.Width, $sender.Height)
    
    # Add animated gradient overlay
    $overlayBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($sender.Width, 0),
        [System.Drawing.Color]::FromArgb(40, 236, 72, 153),
        [System.Drawing.Color]::FromArgb(40, 59, 130, 246)
    )
    $e.Graphics.FillRectangle($overlayBrush, 0, 0, $sender.Width, $sender.Height)
    
    # Add decorative dots pattern
    $patternBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 255, 255, 255))
    for ($i = 0; $i -lt $sender.Width; $i += 30) {
        for ($j = 0; $j -lt $sender.Height; $j += 30) {
            if (($i + $j) % 60 -eq 0) {
                $e.Graphics.FillEllipse($patternBrush, $i, $j, 3, 3)
            }
        }
    }
    $brush.Dispose()
    $overlayBrush.Dispose()
    $patternBrush.Dispose()
}
$form.Controls.Add($titlePanel)

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "🚀 VIEGO BLOG LAUNCHER"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 32, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::White
$titleLabel.AutoSize = $true
$titleLabel.Location = New-Object System.Drawing.Point(50, 30)
$titleLabel.BackColor = [System.Drawing.Color]::Transparent
$titlePanel.Controls.Add($titleLabel)

$subtitleLabel = New-Object System.Windows.Forms.Label
$subtitleLabel.Text = "⚡ Professional Full Stack Development Environment"
$subtitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)
$subtitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(209, 213, 219)
$subtitleLabel.AutoSize = $true
$subtitleLabel.Location = New-Object System.Drawing.Point(50, 80)
$subtitleLabel.BackColor = [System.Drawing.Color]::Transparent
$titlePanel.Controls.Add($subtitleLabel)

# ============================================
# CONTENT PANEL (Middle - Scrollable)
# ============================================
$contentPanel = New-Object System.Windows.Forms.Panel
$contentPanel.Dock = [System.Windows.Forms.DockStyle]::Fill
$contentPanel.AutoScroll = $true
$contentPanel.BackColor = [System.Drawing.Color]::FromArgb(17, 24, 39)
$contentPanel.Padding = New-Object System.Windows.Forms.Padding(50, 35, 50, 35)
$form.Controls.Add($contentPanel)

# ============================================
# BUTTON PANEL (Bottom - Fixed)
# ============================================
$buttonPanel = New-Object System.Windows.Forms.Panel
$buttonPanel.Dock = [System.Windows.Forms.DockStyle]::Bottom
$buttonPanel.Height = 100
$buttonPanel.BackColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
$buttonPanel.Padding = New-Object System.Windows.Forms.Padding(50, 22, 50, 22)
$form.Controls.Add($buttonPanel)

# ============================================
# CONFIGURATION CARD (Modern Card Design)
# ============================================
$configCard = New-Object System.Windows.Forms.Panel
$configCard.Location = New-Object System.Drawing.Point(0, 0)
$configCard.Size = New-Object System.Drawing.Size(1080, 130)
$configCard.BackColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
$configCard.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right
$configCard.Paint += {
    param($sender, $e)
    $e.Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    # Rounded rectangle effect
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = 12
    $rect = New-Object System.Drawing.Rectangle(0, 0, $sender.Width - 1, $sender.Height - 1)
    $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
    $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
    $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
    $path.CloseAllFigures()
    $e.Graphics.FillPath((New-Object System.Drawing.SolidBrush($sender.BackColor)), $path)
    $e.Graphics.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), 2)), $path)
    $path.Dispose()
}
$contentPanel.Controls.Add($configCard)

$clientLabel = New-Object System.Windows.Forms.Label
$clientLabel.Text = "📊 Số lượng Frontend Clients:"
$clientLabel.Font = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$clientLabel.ForeColor = [System.Drawing.Color]::FromArgb(243, 244, 246)
$clientLabel.AutoSize = $true
$clientLabel.Location = New-Object System.Drawing.Point(40, 40)
$clientLabel.BackColor = [System.Drawing.Color]::Transparent
$configCard.Controls.Add($clientLabel)

$clientNumeric = New-Object System.Windows.Forms.NumericUpDown
$clientNumeric.Minimum = 1
$clientNumeric.Maximum = 10
$clientNumeric.Value = 1
$clientNumeric.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$clientNumeric.Size = New-Object System.Drawing.Size(160, 45)
$clientNumeric.Location = New-Object System.Drawing.Point(350, 35)
$clientNumeric.BorderStyle = "FixedSingle"
$clientNumeric.BackColor = [System.Drawing.Color]::FromArgb(55, 65, 81)
$clientNumeric.ForeColor = [System.Drawing.Color]::White
$configCard.Controls.Add($clientNumeric)

$infoLabel = New-Object System.Windows.Forms.Label
$infoLabel.Text = "💡 Chọn số lượng client frontend muốn chạy đồng thời (từ 1 đến 10 instances)"
$infoLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Italic)
$infoLabel.ForeColor = [System.Drawing.Color]::FromArgb(156, 163, 175)
$infoLabel.AutoSize = $true
$infoLabel.Location = New-Object System.Drawing.Point(40, 100)
$infoLabel.BackColor = [System.Drawing.Color]::Transparent
$configCard.Controls.Add($infoLabel)

# ============================================
# STATUS CARD (Modern Status Display)
# ============================================
$statusCard = New-Object System.Windows.Forms.Panel
$statusCard.Location = New-Object System.Drawing.Point(0, 145)
$statusCard.Size = New-Object System.Drawing.Size(1080, 85)
$statusCard.BackColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
$statusCard.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right
$statusCard.Paint += {
    param($sender, $e)
    $e.Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = 12
    $rect = New-Object System.Drawing.Rectangle(0, 0, $sender.Width - 1, $sender.Height - 1)
    $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
    $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
    $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
    $path.CloseAllFigures()
    $e.Graphics.FillPath((New-Object System.Drawing.SolidBrush($sender.BackColor)), $path)
    $e.Graphics.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), 2)), $path)
    $path.Dispose()
}
$contentPanel.Controls.Add($statusCard)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "⚪ Trạng thái: Chưa khởi động"
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(156, 163, 175)
$statusLabel.AutoSize = $true
$statusLabel.Location = New-Object System.Drawing.Point(40, 40)
$statusLabel.BackColor = [System.Drawing.Color]::Transparent
$statusCard.Controls.Add($statusLabel)

# ============================================
# LOG CARD (Terminal Style)
# ============================================
$logCard = New-Object System.Windows.Forms.Panel
$logCard.Location = New-Object System.Drawing.Point(0, 245)
$logCard.Size = New-Object System.Drawing.Size(1080, 180)
$logCard.BackColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
$logCard.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right -bor [System.Windows.Forms.AnchorStyles]::Bottom
$logCard.Paint += {
    param($sender, $e)
    $e.Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = 12
    $rect = New-Object System.Drawing.Rectangle(0, 0, $sender.Width - 1, $sender.Height - 1)
    $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
    $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
    $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
    $path.CloseAllFigures()
    $e.Graphics.FillPath((New-Object System.Drawing.SolidBrush($sender.BackColor)), $path)
    $e.Graphics.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), 2)), $path)
    $path.Dispose()
}
$contentPanel.Controls.Add($logCard)

$logTitleLabel = New-Object System.Windows.Forms.Label
$logTitleLabel.Text = "📋 System Activity Logs"
$logTitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$logTitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(243, 244, 246)
$logTitleLabel.AutoSize = $true
$logTitleLabel.Location = New-Object System.Drawing.Point(30, 20)
$logTitleLabel.BackColor = [System.Drawing.Color]::Transparent
$logCard.Controls.Add($logTitleLabel)

$logTextBox = New-Object System.Windows.Forms.RichTextBox
$logTextBox.Location = New-Object System.Drawing.Point(30, 50)
$logTextBox.Size = New-Object System.Drawing.Size(1020, 115)
$logTextBox.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right
$logTextBox.Font = New-Object System.Drawing.Font("Consolas", 10)
$logTextBox.ReadOnly = $true
$logTextBox.BackColor = [System.Drawing.Color]::FromArgb(17, 24, 39)
$logTextBox.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
$logTextBox.BorderStyle = "None"
$logTextBox.Padding = New-Object System.Windows.Forms.Padding(12)
$logCard.Controls.Add($logTextBox)

# ============================================
# URLS CARD (Modern Links Display)
# ============================================
$urlsCard = New-Object System.Windows.Forms.Panel
$urlsCard.Location = New-Object System.Drawing.Point(0, 440)
$urlsCard.Size = New-Object System.Drawing.Size(1080, 95)
$urlsCard.BackColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
$urlsCard.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right
$urlsCard.Paint += {
    param($sender, $e)
    $e.Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = 12
    $rect = New-Object System.Drawing.Rectangle(0, 0, $sender.Width - 1, $sender.Height - 1)
    $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
    $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
    $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
    $path.CloseAllFigures()
    $e.Graphics.FillPath((New-Object System.Drawing.SolidBrush($sender.BackColor)), $path)
    $e.Graphics.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), 2)), $path)
    $path.Dispose()
}
$contentPanel.Controls.Add($urlsCard)

$urlsLabel = New-Object System.Windows.Forms.Label
$urlsLabel.Text = "🔗 Application URLs sẽ hiển thị sau khi khởi động hệ thống"
$urlsLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Italic)
$urlsLabel.ForeColor = [System.Drawing.Color]::FromArgb(156, 163, 175)
$urlsLabel.AutoSize = $true
$urlsLabel.Location = New-Object System.Drawing.Point(30, 25)
$urlsLabel.BackColor = [System.Drawing.Color]::Transparent
$urlsCard.Controls.Add($urlsLabel)

# ============================================
# BUTTONS (Modern Button Design)
# ============================================
function Create-Button {
    param(
        [string]$Text,
        [System.Drawing.Color]$BackColor,
        [System.Drawing.Color]$HoverColor,
        [int]$Width,
        [int]$Height
    )
    $btn = New-Object System.Windows.Forms.Button
    $btn.Text = $Text
    $btn.Font = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
    $btn.BackColor = $BackColor
    $btn.ForeColor = [System.Drawing.Color]::White
    $btn.FlatStyle = "Flat"
    $btn.FlatAppearance.BorderSize = 0
    $btn.Size = New-Object System.Drawing.Size($Width, $Height)
    $btn.Cursor = [System.Windows.Forms.Cursors]::Hand
    $btn.FlatAppearance.MouseOverBackColor = $HoverColor
    $btn.FlatAppearance.MouseDownBackColor = [System.Drawing.Color]::FromArgb(
        [Math]::Max(0, $HoverColor.R - 30),
        [Math]::Max(0, $HoverColor.G - 30),
        [Math]::Max(0, $HoverColor.B - 30)
    )
    # Add rounded corners with shadow effect
    $btn.Paint += {
        param($sender, $e)
        $e.Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        
        # Draw shadow
        $shadowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $shadowRadius = 10
        $shadowRect = New-Object System.Drawing.Rectangle(2, 2, $sender.Width - 3, $sender.Height - 3)
        $shadowPath.AddArc($shadowRect.X, $shadowRect.Y, $shadowRadius, $shadowRadius, 180, 90)
        $shadowPath.AddArc($shadowRect.Right - $shadowRadius, $shadowRect.Y, $shadowRadius, $shadowRadius, 270, 90)
        $shadowPath.AddArc($shadowRect.Right - $shadowRadius, $shadowRect.Bottom - $shadowRadius, $shadowRadius, $shadowRadius, 0, 90)
        $shadowPath.AddArc($shadowRect.X, $shadowRect.Bottom - $shadowRadius, $shadowRadius, $shadowRadius, 90, 90)
        $shadowPath.CloseAllFigures()
        $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 0, 0, 0))
        $e.Graphics.FillPath($shadowBrush, $shadowPath)
        $shadowPath.Dispose()
        $shadowBrush.Dispose()
        
        # Draw button
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $radius = 10
        $rect = New-Object System.Drawing.Rectangle(0, 0, $sender.Width - 1, $sender.Height - 1)
        $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
        $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
        $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
        $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
        $path.CloseAllFigures()
        $e.Graphics.FillPath((New-Object System.Drawing.SolidBrush($sender.BackColor)), $path)
        $path.Dispose()
    }
    return $btn
}

$startButton = Create-Button -Text "▶️ START SYSTEM" `
    -BackColor [System.Drawing.Color]::FromArgb(16, 185, 129) `
    -HoverColor [System.Drawing.Color]::FromArgb(5, 150, 105) `
    -Width 250 -Height 60
$startButton.Location = New-Object System.Drawing.Point(0, 0)
$buttonPanel.Controls.Add($startButton)

$stopButton = Create-Button -Text "⏹️ STOP SYSTEM" `
    -BackColor [System.Drawing.Color]::FromArgb(239, 68, 68) `
    -HoverColor [System.Drawing.Color]::FromArgb(220, 38, 38) `
    -Width 250 -Height 60
$stopButton.Location = New-Object System.Drawing.Point(270, 0)
$stopButton.Enabled = $false
$buttonPanel.Controls.Add($stopButton)

$exitButton = Create-Button -Text "❌ EXIT APPLICATION" `
    -BackColor [System.Drawing.Color]::FromArgb(107, 114, 128) `
    -HoverColor [System.Drawing.Color]::FromArgb(75, 85, 99) `
    -Width 220 -Height 60
$exitButton.Anchor = [System.Windows.Forms.AnchorStyles]::Right
$exitButton.Location = New-Object System.Drawing.Point(880, 0)
$buttonPanel.Controls.Add($exitButton)

# ============================================
# FUNCTIONS
# ============================================
function Add-Log {
    param([string]$message, [string]$color = "LightGreen")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $logTextBox.SelectionStart = $logTextBox.TextLength
    $logTextBox.SelectionLength = 0
    $logTextBox.SelectionColor = [System.Drawing.Color]::$color
    $logTextBox.AppendText("[$timestamp] $message`r`n")
    $logTextBox.ScrollToCaret()
    [System.Windows.Forms.Application]::DoEvents()
}

function Check-Prerequisites {
    Add-Log "📋 Đang kiểm tra hệ thống..." "Yellow"
    
    $nodePath = "C:\laragon\bin\nodejs\node-v20\node.exe"
    if (-not (Test-Path $nodePath)) {
        Add-Log "❌ Node.js v20 không tìm thấy tại: $nodePath" "Red"
        Add-Log "💡 Vui lòng cài đặt Node.js v20 hoặc cập nhật đường dẫn" "Yellow"
        return $false
    }
    $nodeVersion = & $nodePath --version
    Add-Log "✅ Node.js: $nodeVersion" "Green"
    
    $mysqlPath = "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe"
    if (-not (Test-Path $mysqlPath)) {
        Add-Log "❌ MySQL không tìm thấy tại: $mysqlPath" "Red"
        Add-Log "💡 Vui lòng đảm bảo Laragon MySQL đã được cài đặt" "Yellow"
        return $false
    }
    
    try {
        & $mysqlPath -u root -e "SELECT 1" 2>$null | Out-Null
        Add-Log "✅ MySQL đã kết nối" "Green"
    } catch {
        Add-Log "❌ Không thể kết nối MySQL!" "Red"
        Add-Log "💡 Vui lòng khởi động Laragon và MySQL" "Yellow"
        return $false
    }
    
    try {
        & $mysqlPath -u root -e "USE viego_blog; SELECT COUNT(*) FROM users;" 2>$null | Out-Null
        Add-Log "✅ Database 'viego_blog' OK" "Green"
    } catch {
        Add-Log "⚠️  Database chưa có dữ liệu!" "Yellow"
        Add-Log "💡 Chạy seed_data.bat để tạo dữ liệu mẫu" "Yellow"
    }
    
    if (-not (Test-Path "$projectPath\.venv_new\Scripts\activate.bat")) {
        Add-Log "❌ Virtual environment không tồn tại!" "Red"
        Add-Log "💡 Tạo virtual environment: python -m venv .venv_new" "Yellow"
        return $false
    }
    Add-Log "✅ Virtual environment OK" "Green"
    
    $scripts = @("scripts\run_backend.bat", "scripts\run_frontend.bat", "scripts\run_frontend_port.bat")
    foreach ($script in $scripts) {
        if (-not (Test-Path "$projectPath\$script")) {
            Add-Log "❌ Không tìm thấy: $script" "Red"
            return $false
        }
    }
    Add-Log "✅ Tất cả scripts đã sẵn sàng" "Green"
    
    return $true
}

function Update-URLs {
    param([int]$clientCount)
    
    $urlsCard.Controls.Clear()
    
    $urlsFlowPanel = New-Object System.Windows.Forms.FlowLayoutPanel
    $urlsFlowPanel.Location = New-Object System.Drawing.Point(30, 20)
    $urlsFlowPanel.Size = New-Object System.Drawing.Size(1040, 40)
    $urlsFlowPanel.AutoSize = $true
    $urlsFlowPanel.BackColor = [System.Drawing.Color]::Transparent
    $urlsCard.Controls.Add($urlsFlowPanel)
    
    $backendLabel = New-Object System.Windows.Forms.Label
    $backendLabel.Text = "🔧 Backend:"
    $backendLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $backendLabel.ForeColor = [System.Drawing.Color]::FromArgb(243, 244, 246)
    $backendLabel.AutoSize = $true
    $backendLabel.BackColor = [System.Drawing.Color]::Transparent
    $urlsFlowPanel.Controls.Add($backendLabel)
    
    $backendLink = New-Object System.Windows.Forms.LinkLabel
    $backendLink.Text = "http://localhost:5000"
    $backendLink.Font = New-Object System.Drawing.Font("Segoe UI", 11)
    $backendLink.AutoSize = $true
    $backendLink.LinkColor = [System.Drawing.Color]::FromArgb(96, 165, 250)
    $backendLink.ActiveLinkColor = [System.Drawing.Color]::FromArgb(59, 130, 246)
    $backendLink.VisitedLinkColor = [System.Drawing.Color]::FromArgb(96, 165, 250)
    $backendLink.Add_Click({ Start-Process "http://localhost:5000" })
    $urlsFlowPanel.Controls.Add($backendLink)
    
    $sep1 = New-Object System.Windows.Forms.Label
    $sep1.Text = " | "
    $sep1.Font = New-Object System.Drawing.Font("Segoe UI", 10)
    $sep1.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
    $sep1.AutoSize = $true
    $urlsFlowPanel.Controls.Add($sep1)
    
    for ($i = 1; $i -le $clientCount; $i++) {
        $port = 3000 + $i - 1
        $clientLabel = New-Object System.Windows.Forms.Label
        if ($clientCount -eq 1) {
            $clientLabel.Text = "🌐 Frontend:"
        } else {
            $clientLabel.Text = "🌐 Client $i :"
        }
        $clientLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
        $clientLabel.ForeColor = [System.Drawing.Color]::FromArgb(226, 232, 240)
        $clientLabel.AutoSize = $true
        $clientLabel.BackColor = [System.Drawing.Color]::Transparent
        $urlsFlowPanel.Controls.Add($clientLabel)
        
        $clientLink = New-Object System.Windows.Forms.LinkLabel
        $clientLink.Text = "http://localhost:$port"
        $clientLink.Font = New-Object System.Drawing.Font("Segoe UI", 10)
        $clientLink.AutoSize = $true
        $clientLink.LinkColor = [System.Drawing.Color]::FromArgb(96, 165, 250)
        $clientLink.ActiveLinkColor = [System.Drawing.Color]::FromArgb(59, 130, 246)
        $clientLink.VisitedLinkColor = [System.Drawing.Color]::FromArgb(96, 165, 250)
        $portCopy = $port
        $clientLink.Add_Click({ Start-Process "http://localhost:$portCopy" })
        $urlsFlowPanel.Controls.Add($clientLink)
        
        if ($i -lt $clientCount) {
            $sep = New-Object System.Windows.Forms.Label
            $sep.Text = " | "
            $sep.Font = New-Object System.Drawing.Font("Segoe UI", 10)
            $sep.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
            $sep.AutoSize = $true
            $sep.BackColor = [System.Drawing.Color]::Transparent
            $urlsFlowPanel.Controls.Add($sep)
        }
    }
    
    $loginLabel = New-Object System.Windows.Forms.Label
    $loginLabel.Text = "🔑 Test Accounts: admin@viego.com / Admin@123  |  vana@gmail.com / User@123"
    $loginLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Italic)
    $loginLabel.ForeColor = [System.Drawing.Color]::FromArgb(156, 163, 175)
    $loginLabel.AutoSize = $true
    $loginLabel.Location = New-Object System.Drawing.Point(30, 70)
    $loginLabel.BackColor = [System.Drawing.Color]::Transparent
    $urlsCard.Controls.Add($loginLabel)
}

function Start-Servers {
    param([int]$clientCount)
    
    if ($script:isRunning) {
        Add-Log "⚠️  Hệ thống đang chạy!" "Yellow"
        return
    }
    
    if (-not (Check-Prerequisites)) {
        Add-Log "❌ Kiểm tra hệ thống thất bại!" "Red"
        $statusLabel.Text = "🔴 Trạng thái: Lỗi kiểm tra hệ thống"
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
    Add-Log "📊 Cấu hình: Backend (1) + Frontend Clients ($clientCount)" "Cyan"
    
    Add-Log "🔧 Đang khởi động Backend server..." "Yellow"
    $backendScript = "$projectPath\scripts\run_backend.bat"
    $script:backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "`"$backendScript`"" -PassThru -WindowStyle Normal
    
    Add-Log "⏳ Đợi 5 giây để Backend khởi động..." "Yellow"
    Start-Sleep -Seconds 5
    
    Add-Log "🌐 Đang khởi động Frontend client(s)..." "Yellow"
    $startPort = 3000
    
    for ($i = 1; $i -le $clientCount; $i++) {
        $port = $startPort + $i - 1
        if ($i -eq 1 -and $clientCount -eq 1) {
            $frontendScript = "$projectPath\scripts\run_frontend.bat"
            $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "`"$frontendScript`"" -PassThru -WindowStyle Normal
        } else {
            $frontendScript = "$projectPath\run_frontend_port.bat"
            $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "`"$frontendScript`" $port" -PassThru -WindowStyle Normal
        }
        $script:frontendProcesses += $process
        Add-Log "   ✅ Client $i đã khởi động trên port $port" "Green"
        Start-Sleep -Seconds 3
    }
    
    Update-URLs -clientCount $clientCount
    
    $statusLabel.Text = "🟢 Trạng thái: Đang chạy"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(34, 197, 94)
    Add-Log "✅ Tất cả servers đã khởi động thành công!" "Green"
    Add-Log "💡 Đóng các cửa sổ CMD để dừng servers" "Cyan"
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
    
    try {
        Get-Process | Where-Object { $_.MainWindowTitle -like "*VieGo Blog*" } | 
            ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    } catch {}
    
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
            "Hệ thống đang chạy. Bạn có muốn dừng chúng trước khi thoát?",
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
        $result = [System.Windows.Forms.MessageBox]::Show(
            "Hệ thống đang chạy. Bạn có muốn dừng chúng trước khi thoát?",
            "Xác nhận",
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Question
        )
        if ($result -eq "Yes") {
            Stop-Servers
        }
    }
})

# ============================================
# INITIALIZE
# ============================================
Add-Log "🚀 VieGo Blog System Launcher" "Cyan"
Add-Log "Sẵn sàng khởi động hệ thống..." "Green"
Update-URLs -clientCount 1

# ============================================
# SHOW FORM
# ============================================
[System.Windows.Forms.Application]::EnableVisualStyles()
$form.ShowDialog() | Out-Null
