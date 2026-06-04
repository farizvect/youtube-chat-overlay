# YouTube Chat Overlay — One-Line Installer (Windows)
# irm https://raw.githubusercontent.com/farizvect/youtube-chat-overlay/refs/heads/main/install.ps1 | iex

param(
    [string]$InstallDir = "$HOME\youtube-chat-overlay"
)

$ErrorActionPreference = "Stop"
$Repo = "https://github.com/farizvect/youtube-chat-overlay.git"
$BunBase = "$env:USERPROFILE\.bun\bin"
$BunExe  = "$BunBase\bun.exe"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║   YouTube Live Chat OBS Overlay Installer    ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
Write-Host "  Install to: $InstallDir"
Write-Host ""

# Resolve bun — try PATH first, then known install location
if (Get-Command bun -ErrorAction SilentlyContinue) {
    Write-Host "✅ Bun found: $(bun --version)"
} elseif (Test-Path $BunExe) {
    Write-Host "✅ Bun found: $(& $BunExe --version)"
} else {
    Write-Host "📦 Installing Bun..."
    irm https://bun.sh/install.ps1 | iex

    # Bun installer modifies registry PATH, not current session.
    # Use the known binary location directly.
    if (Test-Path $BunExe) {
        Write-Host "✅ Bun installed: $(& $BunExe --version)"
    } else {
        Write-Host "❌ Bun not found at $BunExe after install."
        Write-Host "   Try restarting PowerShell and re-run this installer."
        exit 1
    }
}

# Clone/download repo
if (Test-Path $InstallDir) {
    Write-Host "📁 Directory already exists: $InstallDir"
    Write-Host "   To reinstall, delete it first: Remove-Item -Recurse -Force $InstallDir"
    exit 1
}

Write-Host ""
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "📥 Cloning repo via git..."
    git clone --depth 1 $Repo $InstallDir
} else {
    Write-Host "📥 Git not found — downloading via Invoke-WebRequest..."
    $ZipUrl = "https://github.com/farizvect/youtube-chat-overlay/archive/refs/heads/main.zip"
    $ZipPath = "$env:TEMP\youtube-chat-overlay.zip"
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath
    Expand-Archive -Path $ZipPath -DestinationPath $env:TEMP
    Move-Item "$env:TEMP\youtube-chat-overlay-main" $InstallDir
    Remove-Item $ZipPath
}
Set-Location $InstallDir

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..."
& $BunExe install
Write-Host "✅ Dependencies installed"

# Run welcome onboarding (then setup wizard)
Write-Host ""
& $BunExe welcome.js

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║   ✅ Installation complete!                  ║"
Write-Host "║                                              ║"
Write-Host "║   To start:                                  ║"
Write-Host "║     cd $InstallDir; .\start.ps1              ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
