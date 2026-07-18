param([string]$ProjectPath = ".")

$ErrorActionPreference = "Stop"
$root = (Resolve-Path $ProjectPath).Path
$page = Join-Path $root "app\page.tsx"
$css = Join-Path $root "app\globals.css"

if (!(Test-Path $page)) {
  throw "app\page.tsx bulunamadı."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $page "$page.backup-$stamp"
if (Test-Path $css) {
  Copy-Item $css "$css.backup-$stamp"
}

$content = Get-Content $page -Raw -Encoding UTF8

# InstallAppButton importu
if ($content -notmatch 'import InstallAppButton') {
  $authImportPattern = 'import AuthButton from "([^"]+)";'
  $authImportMatch = [regex]::Match($content, $authImportPattern)

  if ($authImportMatch.Success) {
    $replacement = $authImportMatch.Value + "`r`n" + 'import InstallAppButton from "../components/InstallAppButton";'
    $content = [regex]::Replace($content, $authImportPattern, [System.Text.RegularExpressions.MatchEvaluator]{
      param($m)
      return $replacement
    }, 1)
  } else {
    throw "AuthButton import satırı bulunamadı."
  }
}

# APK linkini kurulum butonuyla değiştir
$apkPattern = '(?s)<a\s+href="/apk/HASWOLF\.apk"\s+download\s+className="haswolf-download-button[^"]*"\s+aria-label="HASWOLF uygulamasını indir"\s*>.*?</a>'
if ([regex]::IsMatch($content, $apkPattern)) {
  $content = [regex]::Replace($content, $apkPattern, '<InstallAppButton />', 1)
}

# Giriş Yap alanını Uygulama İndir'in soluna ekle
if ($content -notmatch 'haswolf-auth-header') {
  $installPattern = '<InstallAppButton\s*/>'
  $installMatch = [regex]::Match($content, $installPattern)

  if ($installMatch.Success) {
    $authBlock = @'
<div className="haswolf-auth-header">
              <AuthButton />
            </div>
            <InstallAppButton />
'@
    $content = [regex]::Replace($content, $installPattern, [System.Text.RegularExpressions.MatchEvaluator]{
      param($m)
      return $authBlock
    }, 1)
  } else {
    throw "InstallAppButton bulunamadı."
  }
}

Set-Content -Path $page -Value $content -Encoding UTF8

if (Test-Path $css) {
  $cssContent = Get-Content $css -Raw -Encoding UTF8

  if ($cssContent -notmatch 'HASWOLF PWA AUTH FIX V3') {
    $cssContent += @'

/* HASWOLF PWA AUTH FIX V3 */
.haswolf-auth-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
}

.haswolf-auth-header button,
.haswolf-auth-header a {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(217, 170, 74, 0.48);
  border-radius: 0.75rem;
  padding: 0.65rem 0.9rem;
  background: rgba(255, 255, 255, 0.035);
  color: #efc76b;
  white-space: nowrap;
}

@media (max-width: 639px) {
  .haswolf-auth-header button,
  .haswolf-auth-header a {
    padding: 0.55rem 0.7rem;
    font-size: 0.72rem;
  }
}
'@

    Set-Content -Path $css -Value $cssContent -Encoding UTF8
  }
}

Write-Host ""
Write-Host "Düzeltme başarıyla uygulandı." -ForegroundColor Green
Write-Host "Yedek dosya: $page.backup-$stamp"
Write-Host ""
Write-Host "Şimdi Ctrl+C ile sunucuyu kapatıp npm run dev yaz."
