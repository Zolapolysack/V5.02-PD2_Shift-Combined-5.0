param(
  [Parameter(Mandatory = $true)] [string] $RepositoryUrl,
  [string] $DefaultBranch = 'main'
)

<#
Usage (PowerShell):
  ./scripts/deploy-pages.ps1 -RepositoryUrl "https://github.com/<owner>/<repo>.git"

This will:
  - Initialize git if needed
  - Create initial commit with current files
  - Set the remote origin to your repo URL
  - Push to main

After push, GitHub Actions (pages.yml) will build and deploy to GitHub Pages automatically.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Exec($cmd) {
  Write-Host "PS> $cmd" -ForegroundColor Cyan
  iex $cmd
}

if (-not (Test-Path -LiteralPath ".git")) {
  Exec "git init -b $DefaultBranch"
} else {
  Write-Host "Git repository already initialized." -ForegroundColor Yellow
}

if (-not (Test-Path -LiteralPath ".gitattributes")) {
  Set-Content -LiteralPath ".gitattributes" -Value "* text=auto eol=lf`n*.ps1 text eol=crlf" -NoNewline
  git add .gitattributes | Out-Null
}

# Avoid committing local logs or secrets if present
if (-not (Test-Path -LiteralPath ".gitignore")) {
  @(
    "node_modules/",
    "*.log",
    "logs/",
    "server/logs/",
    ".vscode/",
    "_site/",
    "dist/",
    "server/google-credentials.json",
    "GoogleServiceAccount.json"
  ) | Set-Content -LiteralPath .gitignore
  git add .gitignore | Out-Null
}

git add -A

if (-not (git diff --cached --quiet)) {
  git commit -m "chore: initial commit for GitHub Pages deploy"
} else {
  Write-Host "No changes to commit." -ForegroundColor Yellow
}

# Set origin
if (-not (git remote | Select-String -SimpleMatch "origin")) {
  Exec "git remote add origin `"$RepositoryUrl`""
} else {
  Write-Host "Remote 'origin' already set." -ForegroundColor Yellow
}

# Push
Exec "git push -u origin $DefaultBranch"

Write-Host "Done. Open your repository Settings > Pages to confirm. The workflow will publish automatically." -ForegroundColor Green
