Param(
  [string]$WorkingDir = "${PWD}"
)

Write-Output "Launching PD2 combined dev environment from: $WorkingDir"

# Start web server in a new PowerShell window (http-server via npm)
Write-Output "Starting web server (npm run start) in new window..."
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -NoExit -Command \"cd '$WorkingDir'; npm run start\""

# Start backend using existing start-api.ps1 which launches a background job
Write-Output "Starting backend via scripts/start-api.ps1..."
& powershell -NoProfile -ExecutionPolicy Bypass -File "$WorkingDir\scripts\start-api.ps1" -WorkingDir $WorkingDir

# Start dev watcher in new window
Write-Output "Starting dev watcher (npm run watch-reload) in new window..."
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -NoExit -Command \"cd '$WorkingDir'; npm run watch-reload\""

Write-Output "All processes launched. Use the Stop API task or scripts/stop-api.ps1 to stop the background backend job."
