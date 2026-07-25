param(
  [string]$ProjectPath = "C:\Users\Lenovo\haswolf-v6"
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $ProjectPath ".haswolf-backup-mic-recovery-$stamp"

New-Item -ItemType Directory -Path $backup -Force | Out-Null

$providerPath = Join-Path $ProjectPath "components\PersistentVoiceProvider.tsx"
$cssPath = Join-Path $ProjectPath "app\globals.css"

Copy-Item $providerPath (Join-Path $backup "PersistentVoiceProvider.tsx") -Force
Copy-Item $cssPath (Join-Path $backup "globals.css") -Force

Copy-Item `
  (Join-Path $PSScriptRoot "PersistentVoiceProvider.tsx") `
  $providerPath `
  -Force

$cssText = Get-Content $cssPath -Raw -Encoding UTF8
$marker = "/* HASWOLF V6 microphone recovery */"

if (-not $cssText.Contains($marker)) {
  $cssText += "`r`n" + (
    Get-Content `
      (Join-Path $PSScriptRoot "microphone-recovery.css") `
      -Raw `
      -Encoding UTF8
  )

  Set-Content $cssPath $cssText -Encoding UTF8
}

Write-Host ""
Write-Host "Mikrofon kurtarma paketi uygulandi." -ForegroundColor Green
Write-Host "Yedek: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Simdi:" -ForegroundColor Cyan
Write-Host "taskkill /F /IM node.exe"
Write-Host "Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue"
Write-Host "npm run build"
