# YouTube Chat Overlay — Installer / Updater (Windows)
# Fresh install: irm https://raw.githubusercontent.com/farizvect/youtube-chat-overlay/refs/heads/main/install.ps1 | iex
# Update:        run the same command again

param(
    [string]$InstallDir = "$env:USERPROFILE\youtube-chat-overlay"
)

$ErrorActionPreference = "Stop"
$Repo = "https://github.com/farizvect/youtube-chat-overlay.git"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║   YouTube Live Chat OBS Overlay              ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""

function Add-PathIfExists {
    param([string]$Path)
    if ($Path -and (Test-Path -LiteralPath $Path) -and ($env:Path -notlike "*$Path*")) {
        $env:Path = "$Path;$env:Path"
    }
}

function Get-BunCandidatePaths {
    $profileDirs = @(
        $env:USERPROFILE,
        $HOME,
        [Environment]::GetFolderPath("UserProfile")
    ) | Where-Object { $_ } | Select-Object -Unique

    $installDirs = @()
    if ($env:BUN_INSTALL) { $installDirs += $env:BUN_INSTALL }
    foreach ($dir in $profileDirs) { $installDirs += (Join-Path $dir ".bun") }
    if ($env:ProgramFiles) { $installDirs += (Join-Path $env:ProgramFiles "bun") }

    $bins = @()
    foreach ($dir in ($installDirs | Where-Object { $_ } | Select-Object -Unique)) {
        $bins += (Join-Path $dir "bin\bun.exe")
        $bins += (Join-Path $dir "bin\bun")
        $bins += (Join-Path $dir "bun.exe")
    }
    return $bins | Select-Object -Unique
}

# Find bun — try PATH first, then common install locations.
function Find-Bun {
    foreach ($b in (Get-BunCandidatePaths)) {
        $dir = Split-Path -Parent $b
        Add-PathIfExists $dir
    }

    $cmd = Get-Command bun -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source -and (Test-Path -LiteralPath $cmd.Source)) { return $cmd.Source }

    foreach ($b in (Get-BunCandidatePaths)) {
        if ($b -and (Test-Path -LiteralPath $b)) {
            return (Resolve-Path -LiteralPath $b).Path
        }
    }
    return $null
}

function Wait-ForBun {
    param([int]$Attempts = 20)
    for ($i = 1; $i -le $Attempts; $i++) {
        $found = Find-Bun
        if ($found) { return $found }
        Start-Sleep -Milliseconds 500
    }
    return $null
}

$bunExe = Find-Bun

if ($bunExe) {
    Write-Host "✅ Bun found: $(& $bunExe --version)"
} else {
    Write-Host "📦 Installing Bun..."
    irm https://bun.sh/install.ps1 | iex

    # Bun installer usually writes to USERPROFILE\.bun and sets BUN_INSTALL.
    # Refresh current-process PATH and retry because the executable can appear
    # a moment after the installer subprocess returns on Windows.
    if (-not $env:BUN_INSTALL) { $env:BUN_INSTALL = (Join-Path $env:USERPROFILE ".bun") }
    Add-PathIfExists (Join-Path $env:BUN_INSTALL "bin")
    Add-PathIfExists (Join-Path $env:USERPROFILE ".bun\bin")
    Add-PathIfExists (Join-Path $HOME ".bun\bin")

    $bunExe = Wait-ForBun
    if (-not $bunExe) {
        Write-Host "❌ Bun install finished, but bun.exe was not found in this PowerShell session."
        Write-Host "   Checked paths:"
        foreach ($p in (Get-BunCandidatePaths)) { Write-Host "   - $p" }
        Write-Host "   Try opening a new PowerShell and re-run the installer."
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
bun install
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
