# YouTube Chat Overlay — One-Line Installer (Windows)
# irm https://raw.githubusercontent.com/farizvect/youtube-chat-overlay/refs/heads/main/install.ps1 | iex

param(
    [string]$InstallDir = "$HOME\youtube-chat-overlay"
)

$ErrorActionPreference = "Stop"
$Repo = "https://github.com/farizvect/youtube-chat-overlay.git"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║   YouTube Live Chat OBS Overlay Installer    ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
Write-Host "  Install to: $InstallDir"
Write-Host ""

# Check/install Bun
$bun = Get-Command bun -ErrorAction SilentlyContinue
if ($bun) {
    Write-Host "✅ Bun found: $(bun --version)"
} else {
    Write-Host "📦 Installing Bun..."
    irm bun.sh/install.ps1 | iex
    $env:Path = "$HOME\.bun\bin;$env:Path"
    Write-Host "✅ Bun installed: $(bun --version)"
}

# Clone/download repo
if (Test-Path $InstallDir) {
    Write-Host "📁 Directory already exists: $InstallDir"
    Write-Host "   To reinstall, delete it first: Remove-Item -Recurse -Force $InstallDir"
    exit 1
}

Write-Host ""
$git = Get-Command git -ErrorAction SilentlyContinue
if ($git) {
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
bun install
Write-Host "✅ Dependencies installed"

# Run interactive config wizard
Write-Host ""
bun setup.js

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║   ✅ Installation complete!                  ║"
Write-Host "║                                              ║"
Write-Host "║   To start:                                  ║"
Write-Host "║     cd $InstallDir; .\start.ps1              ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
