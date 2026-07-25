param(
  [string]$ProjectPath = "C:\Users\Lenovo\haswolf-v6"
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $ProjectPath ".haswolf-backup-persistent-voice-$stamp"

New-Item -ItemType Directory -Path $backup -Force | Out-Null

$providerPath = Join-Path $ProjectPath "components\PersistentVoiceProvider.tsx"
$cssPath = Join-Path $ProjectPath "app\globals.css"

if (Test-Path $providerPath) {
  Copy-Item $providerPath (Join-Path $backup "PersistentVoiceProvider.tsx") -Force
}

if (Test-Path $cssPath) {
  Copy-Item $cssPath (Join-Path $backup "globals.css") -Force
}

Copy-Item `
  (Join-Path $PSScriptRoot "PersistentVoiceProvider.tsx") `
  $providerPath `
  -Force

$css = Get-Content $cssPath -Raw -Encoding UTF8
$marker = "/* HASWOLF V6 persistent voice mobile hotfix */"

if (-not $css.Contains($marker)) {
  $css += "`r`n" + (
    Get-Content `
      (Join-Path $PSScriptRoot "persistent-voice-mobile.css") `
      -Raw `
      -Encoding UTF8
  )

  Set-Content $cssPath $css -Encoding UTF8
}

Write-Host ""
Write-Host "Kalici ses odasi hotfix uygulandi." -ForegroundColor Green
Write-Host "Yedek: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Simdi:" -ForegroundColor Cyan
Write-Host "taskkill /F /IM node.exe"
Write-Host "Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue"
Write-Host "npm run build"
