param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$gameRoot = Split-Path -Parent $PSScriptRoot
$previewUrl = 'http://127.0.0.1:4173'
$isReady = $false
try {
    $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 2
    if ($response.Content -notmatch '<title>Dungeon Row') { throw 'Port 4173 is used by another program.' }
    $isReady = $true
} catch {
    if ($_.Exception.Message -eq 'Port 4173 is used by another program.') { throw }
}
if (-not $isReady) {
    $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $nodeCommand) { throw 'Node.js is missing. Install Node.js and start the game again.' }
    $logRoot = Join-Path $gameRoot 'tmp'
    New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
    Start-Process -FilePath $nodeCommand.Source -ArgumentList 'scripts/serve.mjs' -WorkingDirectory $gameRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logRoot 'server.log') -RedirectStandardError (Join-Path $logRoot 'server-error.log') | Out-Null
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        try {
            $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 1
            if ($response.StatusCode -eq 200 -and $response.Content -match '<title>Dungeon Row') { $isReady = $true; break }
        } catch { }
    }
}
if (-not $isReady) { throw 'The game could not start. See tmp/server-error.log.' }
if (-not $NoBrowser) { Start-Process $previewUrl }
Write-Output "Dungeon Row is ready: $previewUrl"
