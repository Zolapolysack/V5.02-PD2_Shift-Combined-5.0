param(
  [string]$WorkingDir = "${PWD}",
  [switch]$Foreground,
  [switch]$ForceInstall
)

$ErrorActionPreference = 'Stop'

$serverDir = Join-Path $WorkingDir 'server'
if(!(Test-Path $serverDir)){ Write-Error "Server directory not found: $serverDir"; exit 1 }

# Ensure logs directory exists
$logsDir = Join-Path $serverDir 'logs'
if(!(Test-Path $logsDir)){ New-Item -ItemType Directory -Path $logsDir | Out-Null }
$log = Join-Path $logsDir 'api-start.log'
if(Test-Path $log){ Remove-Item $log -Force }
New-Item -ItemType File -Path $log | Out-Null

# Auto install dependencies if missing or forced
if($ForceInstall -or -not (Test-Path (Join-Path $serverDir 'node_modules'))){
  Write-Output '[start-api] Installing server dependencies...'
  pushd $serverDir | Out-Null
  npm install --no-audit --no-fund | Tee-Object -FilePath $log -Append
  popd | Out-Null
}

function Start-Backend {
  param([string]$Dir,[string]$LogFile)
  Set-Location $Dir
  Write-Output ("[start-api] Launching server at " + (Get-Date -Format o)) | Tee-Object -FilePath $LogFile -Append
  node index.js 2>&1 | Tee-Object -FilePath $LogFile -Append
}

if($Foreground){
  Write-Output "[start-api] Starting in foreground (Ctrl+C to stop)"
  pushd $serverDir | Out-Null
  Start-Backend -Dir $serverDir -LogFile $log
  popd | Out-Null
} else {
  Start-Job -Name 'pd2-backend' -ScriptBlock {
    param($dir,$logFile)
    Set-Location $dir
    node index.js > $logFile 2>&1
  } -ArgumentList $serverDir,$log | Out-Null
  Write-Output "Started backend as job; logs -> $log (use -Foreground to attach)"
}
