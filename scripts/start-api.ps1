param(
  [string]$WorkingDir = "${PWD}"
)
$log = Join-Path $WorkingDir 'server\logs\api-start.log'
if(Test-Path $log){ Remove-Item $log -Force }
Start-Job -ScriptBlock { param($wd,$log) Set-Location $wd; node server/index.js > $log 2>&1 } -ArgumentList $WorkingDir,$log | Out-Null
Write-Output "Started backend as job; logs -> $log"
