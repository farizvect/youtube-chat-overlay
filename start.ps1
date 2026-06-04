# YouTube Chat Overlay — Start (Windows)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$BunExe = "$env:USERPROFILE\.bun\bin\bun.exe"
if (-not (Test-Path $BunExe)) { $BunExe = "bun" }

& $BunExe start.js
