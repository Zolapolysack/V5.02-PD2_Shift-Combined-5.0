This repository includes convenience tasks and a PowerShell launcher to start the local development environment on Windows.

What was added

- `.vscode/tasks.json` — VS Code tasks for:
  - Start Web Server (runs `npm run start`)
  - Start API (runs `scripts/start-api.ps1`)
  - Stop API (runs `scripts/stop-api.ps1`)
  - Start Dev Watcher (runs `npm run watch-reload`)
  - Run Smoke Tests (runs `npm run smoke`)
  - Run All (runs `scripts/run-all.ps1`)
- `scripts/run-all.ps1` — starts the web server and dev watcher in new PowerShell windows and starts the backend as a background job.

How to use

1. From VS Code: open the Command Palette and run `Tasks: Run Task`, then choose a task (e.g. "Run All (PowerShell)").

2. From PowerShell (recommended):

   - To launch everything from the repository root:

     powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-all.ps1

   - To stop the backend job:

     powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-api.ps1

Notes and safety

- The backend is started with `Start-Job` in `scripts/start-api.ps1` and logs to `server\logs\api-start.log`.
- `run-all.ps1` opens new PowerShell windows for interactive long-running processes so you can see logs and cancel them manually.
- The scripts use ExecutionPolicy Bypass for convenience; if your environment restricts script execution, run the commands manually or sign the scripts.

If you want me to also add an npm script that runs `run-all.ps1`, or wire a combined `npm run dev` command, tell me and I will add it.
