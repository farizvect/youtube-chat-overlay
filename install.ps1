# YouTube Chat Overlay — Installer / Updater (Windows)
# Fresh install: irm https://raw.githubusercontent.com/farizvect/youtube-chat-overlay/refs/heads/main/install.ps1 | iex
# Update:        run the same command again

param(
    [string]$InstallDir = "$HOME\youtube-chat-overlay"
)

$ErrorActionPreference = "Stop"
$Repo = "https://github.com/farizvect/youtube-chat-overlay.git"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║   YouTube Live Chat OBS Overlay              ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""

# Find bun — try PATH first, then known locations
function Find-Bun {
    $known = @(
        "$HOME\.bun\bin",
        "$env:ProgramFiles\bun"
    )
    foreach ($p in $known) {
        if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
            $env:Path = "$p;$env:Path"
        }
    }

    $cmd = Get-Command bun -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $bins = @(
        "$HOME\.bun\bin\bun.exe",
        "$HOME\.bun\bin\bun",
        "$env:ProgramFiles\bun\bun.exe"
    )
    foreach ($b in $bins) {
        if (Test-Path $b) { return $b }
    }
    return $null
}

$bunExe = Find-Bun

if ($bunExe) {
    Write-Host "✅ Bun found: $(& $bunExe --version)"
} else {
    Write-Host "📦 Installing Bun..."
    irm https://bun.sh/install.ps1 | iex
    $env:Path = "$HOME\.bun\bin;$env:Path"
    $bunExe = Find-Bun
    if (-not $bunExe) {
        Write-Host "❌ Bun install failed — try restarting PowerShell and re-run."
        Write-Host "   Or install manually: irm https://bun.sh/install.ps1 | iex"
        exit 1
    }
    Write-Host "✅ Bun installed: $(& $bunExe --version)"
}

function bun { & $bunExe @args }

Write-Host ""

# Clone or update repo
if (Test-Path "$InstallDir\.git") {
    Write-Host "📂 Found existing install: $InstallDir"
    Write-Host "📥 Updating..."
    Set-Location $InstallDir

    $before = git rev-parse HEAD
    git fetch origin main --quiet
    git reset --hard origin/main --quiet
    $after = git rev-parse HEAD

    if ($before -eq $after) {
        Write-Host "✅ Already up to date ($after)"
    } else {
        $changes = git log --oneline "$before..$after"
        Write-Host "✅ Updated!"
        Write-Host $changes
    }
} elseif (Test-Path $InstallDir) {
    Write-Host "❌ Directory exists but is not a git repo: $InstallDir"
    Write-Host "   Delete it first: Remove-Item -Recurse -Force $InstallDir"
    exit 1
} else {
    Write-Host "📥 Installing to: $InstallDir"
    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
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
}

# Install/update dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..."
bun install --ignore-scripts
Write-Host "✅ Dependencies installed"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║   ✅ Done!                                   ║"
Write-Host "║                                              ║"
Write-Host "║   To start:                                  ║"
Write-Host "║     cd $InstallDir; bun start.js             ║"
Write-Host "║                                              ║"
Write-Host "║   To edit setup later:                       ║"
Write-Host "║     cd $InstallDir; bun start.js --setup     ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
