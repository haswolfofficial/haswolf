param(
  [string]$ProjectPath = "."
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path $ProjectPath).Path
$page = Join-Path $root "app\page.tsx"
$css  = Join-Path $root "app\globals.css"

if (!(Test-Path $page)) {
  throw "app\page.tsx bulunamadı. Scripti HASWOLF proje klasöründe çalıştır."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $page "$page.backup-$stamp"
if (Test-Path $css) { Copy-Item $css "$css.backup-$stamp" }

$content = Get-Content $page -Raw -Encoding UTF8

# 1) Üst alandaki Uygulama İndir düğmesinin soluna Giriş Yap / AuthButton ekle.
if ($content -notmatch 'haswolf-auth-top') {
  $downloadPattern = '(?s)(\s*<a\s+href="/apk/HASWOLF\.apk"\s+download\s+className="haswolf-download-button[^"]*"\s+aria-label="HASWOLF uygulamasını indir"\s*>)'
  if ($content -match $downloadPattern) {
    $auth = @'

            <div className="haswolf-auth-top">
              <AuthButton />
            </div>
'@
    $content = [regex]::Replace($content, $downloadPattern, $auth + '$1', 1)
  } else {
    Write-Warning "APK indirme düğümü bulunamadı; giriş düğmesi otomatik eklenemedi."
  }
}

# 2) Üst alandaki üç nokta/hamburger menü düğmesini kaldır.
$menuPattern = '(?s)\s*<button\s+type="button"\s+aria-label=\{mobileMenuOpen \? "Menüyü kapat" : "Menüyü aç"\}\s+aria-expanded=\{mobileMenuOpen\}\s+onClick=\{\(\) => setMobileMenuOpen\(\(value\) => !value\)\}\s+className="haswolf-menu-button"\s*>.*?</button>'
$content = [regex]::Replace($content, $menuPattern, '', 1)

# 3) Ana navigasyondaki ilk Sohbet Odaları bağlantısını kaldır.
$chatPattern = '(?s)\s*<a href="/topluluk"><span aria-hidden="true">👥</span><span>Sohbet Odaları</span></a>'
$content = [regex]::Replace($content, $chatPattern, '', 1)

# 4) Sohbet Odaları'nı Admin'in hemen önüne ekle.
if ($content -notmatch 'haswolf-chat-before-admin') {
  $adminPattern = '(\s*\{isAdmin && <a href="/admin"><span aria-hidden="true">🛡</span><span>Admin</span></a>\})'
  if ($content -match $adminPattern) {
    $chatBeforeAdmin = @'
            <a href="/topluluk" className="haswolf-chat-before-admin">
              <span aria-hidden="true">👥</span>
              <span>Sohbet Odaları</span>
            </a>
'@
    $content = [regex]::Replace($content, $adminPattern, "`r`n$chatBeforeAdmin`$1", 1)
  } else {
    Write-Warning "Koşullu Admin bağlantısı bulunamadı; Sohbet Odaları otomatik taşınamadı."
  }
}

Set-Content -Path $page -Value $content -Encoding UTF8

# CSS ekle
if (Test-Path $css) {
  $cssContent = Get-Content $css -Raw -Encoding UTF8
  if ($cssContent -notmatch 'HASWOLF HEADER HOTFIX V2') {
    $cssContent += @'

/* HASWOLF HEADER HOTFIX V2 */
.haswolf-auth-top {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
}
.haswolf-auth-top button,
.haswolf-auth-top a {
  min-height: 3rem;
  border: 1px solid rgba(217,170,74,.55);
  border-radius: .75rem;
  padding: .65rem .9rem;
  background: rgba(255,255,255,.035);
  color: #efc76b;
  white-space: nowrap;
}
.haswolf-chat-before-admin {
  margin-left: auto;
}
@media (max-width: 639px) {
  .haswolf-auth-top button,
  .haswolf-auth-top a {
    min-height: 3rem;
    padding: .55rem .7rem;
    font-size: .75rem;
  }
}
'@
    Set-Content -Path $css -Value $cssContent -Encoding UTF8
  }
}

# Uygulama ikonunu public içine kopyala
$packageIcon = Join-Path $PSScriptRoot "haswolf-app-icon.png"
if (Test-Path $packageIcon) {
  $publicDir = Join-Path $root "public"
  New-Item -ItemType Directory -Force -Path $publicDir | Out-Null
  Copy-Item $packageIcon (Join-Path $publicDir "haswolf-app-icon.png") -Force
}

Write-Host ""
Write-Host "HASWOLF header düzenlemesi tamamlandı." -ForegroundColor Green
Write-Host "Yedek: $page.backup-$stamp"
Write-Host ""
Write-Host "Şimdi terminalde:" -ForegroundColor Yellow
Write-Host "  npm run dev"
Write-Host "Tarayıcıda:"
Write-Host "  http://localhost:3000"
