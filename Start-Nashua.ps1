param([switch]$NoBrowser)

$projectRoot = $PSScriptRoot
$previewUrl = 'http://127.0.0.1:8770/'
$isRunning = $false
try { $response = Invoke-WebRequest -UseBasicParsing -Uri $previewUrl -TimeoutSec 2; $isRunning = $response.Content -match 'Nashua Table' } catch {}
if (-not $isRunning) {
    $nodePath = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $nodePath -ArgumentList 'scripts/serve.mjs' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'server.log') -RedirectStandardError (Join-Path $projectRoot 'server-error.log')
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        try { $response = Invoke-WebRequest -UseBasicParsing -Uri $previewUrl -TimeoutSec 1; if ($response.Content -match 'Nashua Table') { $isRunning = $true; break } } catch {}
    }
}
if ($isRunning) {
    if (-not $NoBrowser) { Start-Process $previewUrl }
    Write-Output "Nashua Table is running at $previewUrl"
} else { throw 'Could not start Nashua Table. Check server-error.log or run npm start in this folder.' }
