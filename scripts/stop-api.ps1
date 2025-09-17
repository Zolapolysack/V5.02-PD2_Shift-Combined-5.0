# Stops any Start-Job that launched server/index.js
$jobs = Get-Job | Where-Object { $_.Command -match 'server/index.js' }
if(!$jobs){ Write-Output 'No backend jobs found'; exit }
$jobs | Stop-Job
$jobs | Remove-Job
Write-Output 'Stopped backend job(s)'
