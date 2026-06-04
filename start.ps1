# YouTube Chat Overlay — Start (Windows)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║     YouTube Live Chat Overlay — Start        ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""

# Check if Bun installed
$bun = Get-Command bun -ErrorAction SilentlyContinue
if (-not $bun) {
    Write-Host "❌ Bun not found. Run install.ps1 first."
    exit 1
}

# Pick config
Write-Host "Available configs:"
$ConfigsDir = Join-Path $ScriptDir "configs"
$Configs = @(Get-ChildItem "$ConfigsDir\*.json" -ErrorAction SilentlyContinue | ForEach-Object { $_.BaseName })
if ($Configs.Count -eq 0) {
    Write-Host "  (none — using template)"
    $Configs = @("default")
    New-Item -ItemType Directory -Force -Path $ConfigsDir | Out-Null
    Copy-Item "$ScriptDir\config.template.json" "$ConfigsDir\default.json"
}

$Active = ""
$LinkPath = Join-Path $ScriptDir "config.json"
if (Test-Path $LinkPath) {
    $target = (Get-Item $LinkPath).Target
    if ($target) {
        $Active = [System.IO.Path]::GetFileNameWithoutExtension($target)
    }
}

for ($i = 0; $i -lt $Configs.Count; $i++) {
    $marker = if ($Configs[$i] -eq $Active) { " ← active" } else { "" }
    Write-Host "  $($i+1)) $($Configs[$i])$marker"
}
Write-Host "  n) Create new config"
Write-Host ""
$choice = Read-Host "Pick config [1-$($Configs.Count)/n, default=1]"

if ($choice -eq "n") {
    $newName = Read-Host "New config name"
    if ($newName) {
        Copy-Item "$ScriptDir\config.template.json" "$ConfigsDir\$newName.json"
        Write-Host "✅ Created config: $newName"
        $Selected = $newName
    } else {
        $Selected = $Configs[0]
    }
} else {
    $idx = [int]$choice - 1
    if ($idx -ge 0 -and $idx -lt $Configs.Count) {
        $Selected = $Configs[$idx]
    } else {
        $Selected = $Configs[0]
    }
}

# Activate selected config
Remove-Item $LinkPath -Force -ErrorAction SilentlyContinue
try {
    New-Item -ItemType SymbolicLink -Path $LinkPath -Target "configs\$Selected.json" -Force -ErrorAction Stop | Out-Null
} catch {
    # Symlink requires admin or Developer Mode — fall back to copy
    Copy-Item "$ConfigsDir\$Selected.json" $LinkPath
}
Write-Host "📋 Using config: $Selected"
Write-Host ""

# Ask for YouTube source
Write-Host "Connect to YouTube chat:"
Write-Host "  1) Live Video ID (e.g. puhZur2y-g8)"
Write-Host "  2) Channel Handle (e.g. @YourChannel)"
Write-Host ""
$srcChoice = Read-Host "Choice [1/2]"

if ($srcChoice -eq "2") {
    $channel = Read-Host "Enter channel handle (with @)"
    Write-Host ""
    Write-Host "🚀 Starting with config: $Selected | channel: $channel"
    Write-Host "   OBS Browser Source URL: http://localhost:6969"
    Write-Host "   💡 GIFs go in: public/gifs/"
    Write-Host ""
    & bun "$ScriptDir\server.js" "--channel=$channel"
} else {
    $liveId = Read-Host "Enter live video ID"
    Write-Host ""
    Write-Host "🚀 Starting with config: $Selected | live: $liveId"
    Write-Host "   OBS Browser Source URL: http://localhost:6969"
    Write-Host "   💡 GIFs go in: public/gifs/"
    Write-Host ""
    & bun "$ScriptDir\server.js" "--live=$liveId"
}
