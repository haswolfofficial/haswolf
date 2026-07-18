param([string]$ProjectPath = ".")

$ErrorActionPreference = "Stop"
$root = (Resolve-Path $ProjectPath).Path
$page = Join-Path $root "app\page.tsx"
$css = Join-Path $root "app\globals.css"
$components = Join-Path $root "components"
$public = Join-Path $root "public"

if (!(Test-Path $page)) { throw "app\page.tsx bulunamadı." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $page "$page.backup-$stamp"
if (Test-Path $css) { Copy-Item $css "$css.backup-$stamp" }

New-Item -ItemType Directory -Force -Path $components | Out-Null
New-Item -ItemType Directory -Force -Path $public | Out-Null
Copy-Item (Join-Path $PSScriptRoot "components\InstallAppButton.tsx") (Join-Path $components "InstallAppButton.tsx") -Force
Copy-Item (Join-Path $PSScriptRoot "public\sw.js") (Join-Path $public "sw.js") -Force

$content = Get-Content $page -Raw -Encoding UTF8

# Importları ekle
if ($content -notmatch 'InstallAppButton') {
  $content = $content -replace '(import AuthButton from "[^"]+";)', '$1' + "`r`n" + 'import InstallAppButton from "../components/InstallAppButton";'
}

# Eski APK linkini PWA kurulum düğmesiyle değiştir
$apkPattern = '(?s)<a\s+href="/apk/HASWOLF\.apk"\s+download\s+className="haswolf-download-button[^"]*"\s+aria-label="HASWOLF uygulamasını indir"\s*>.*?</a>'
if ($content -match $apkPattern) {
  $content = [regex]::Replace($content, $apkPattern, '<InstallAppButton />', 1)
}

# Giriş Yap düğmesini kurulum düğmesinin soluna ekle
if ($content -notmatch 'haswolf-auth-header') {
  $installPattern = '(\s*<InstallAppButton\s*/>)'
  $authBlock = @'
            <div className="haswolf-auth-header">
              <AuthButton />
            </div>
'@
  $content = [regex]::Replace($content, $installPattern, "`r`n$authBlock`$1", 1)
}

Set-Content -Path $page -Value $content -Encoding UTF8

if (Test-Path $css) {
  $cssContent = Get-Content $css -Raw -Encoding UTF8
  if ($cssContent -notmatch 'HASWOLF PWA AUTH FIX') {
    $cssContent += @'

/* HASWOLF PWA AUTH FIX */
.haswolf-auth-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
}
.haswolf-auth-header > * {
  min-height: 3rem;
}
.haswolf-auth-header button,
.haswolf-auth-header a {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(217,170,74,.48);
  border-radius: .75rem;
  padding: .65rem .9rem;
  background: rgba(255,255,255,.035);
  color: #efc76b;
  white-space: nowrap;
}
.haswolf-download-button:disabled {
  cursor: default;
  opacity: .72;
}
@media (max-width: 639px) {
  .haswolf-auth-header button,
  .haswolf-auth-header a {
    padding: .55rem .7rem;
    font-size: .72rem;
  }
}
'@
    Set-Content -Path $css -Value $cssContent -Encoding UTF8
  }
}

Write-Host ""
Write-Host "Giriş butonu ve PWA kurulum düğmesi eklendi." -ForegroundColor Green
Write-Host "Yedek: $page.backup-$stamp"
Write-Host ""
Write-Host "Şimdi çalışan sunucuyu Ctrl+C ile kapatıp npm run dev yaz."
