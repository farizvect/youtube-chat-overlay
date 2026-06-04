# YouTube Chat Overlay — Start (Windows)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$bun = Get-Command bun -ErrorAction SilentlyContinue
if (-not $bun) {
    Write-Host "❌ Bun not found. Run install.ps1 first."
    exit 1
}

& $bun.Source "$ScriptDir\start.js"
exit $LASTEXITCODE
