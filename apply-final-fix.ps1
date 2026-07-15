param([string]$ProjectPath = ".")

$ErrorActionPreference = "Stop"
$root = (Resolve-Path $ProjectPath).Path
$page = Join-Path $root "app\page.tsx"
$css = Join-Path $root "app\globals.css"
$componentTarget = Join-Path $root "app\components\InstallAppButton.tsx"
$swTarget = Join-Path $root "public\sw.js"

if (!(Test-Path $page)) { throw "app\page.tsx bulunamadı." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $page "$page.backup-$stamp"
if (Test-Path $css) { Copy-Item $css "$css.backup-$stamp" }

New-Item -ItemType Directory -Force -Path (Split-Path $componentTarget) | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $swTarget) | Out-Null

$sourceComponent = Join-Path $PSScriptRoot "app\components\InstallAppButton.tsx"
$sourceSw = Join-Path $PSScriptRoot "public\sw.js"

if ((Resolve-Path $sourceComponent).Path -ne $componentTarget) {
  Copy-Item $sourceComponent $componentTarget -Force
}
if ((Resolve-Path $sourceSw).Path -ne $swTarget) {
  Copy-Item $sourceSw $swTarget -Force
}

$content = Get-Content $page -Raw -Encoding UTF8

if ($content -notmatch 'import InstallAppButton from "./components/InstallAppButton";') {
  $authLine = [regex]::Match($content, 'import AuthButton from "\./components/AuthButton";')
  if (!$authLine.Success) { throw "AuthButton importu bulunamadı." }
  $content = $content.Insert(
    $authLine.Index + $authLine.Length,
    "`r`nimport InstallAppButton from `"./components/InstallAppButton`";"
  )
}

# Uygulama indir alanını, sınıf adına bakarak güvenli biçimde bul.
$downloadStart = $content.IndexOf('<a href="/apk/HASWOLF.apk"')
if ($downloadStart -lt 0) {
  $downloadStart = $content.IndexOf('<a')
  while ($downloadStart -ge 0) {
    $close = $content.IndexOf('</a>', $downloadStart)
    if ($close -lt 0) { break }
    $segment = $content.Substring($downloadStart, $close + 4 - $downloadStart)
    if ($segment.Contains('haswolf-download-button')) { break }
    $downloadStart = $content.IndexOf('<a', $close + 4)
  }
}

if ($downloadStart -ge 0) {
  $downloadEnd = $content.IndexOf('</a>', $downloadStart)
  if ($downloadEnd -lt 0) { throw "Uygulama İndir bağlantısının kapanışı bulunamadı." }
  $downloadEnd += 4
  $replacement = @'
<div className="haswolf-auth-header">
              <AuthButton />
            </div>
            <InstallAppButton />
'@
  $content = $content.Remove($downloadStart, $downloadEnd - $downloadStart).Insert($downloadStart, $replacement)
}
elseif ($content -match '<InstallAppButton\s*/>') {
  if ($content -notmatch 'haswolf-auth-header') {
    $content = $content.Replace(
      '<InstallAppButton />',
      "<div className=`"haswolf-auth-header`">`r`n              <AuthButton />`r`n            </div>`r`n            <InstallAppButton />"
    )
  }
}
else {
  throw "Uygulama İndir alanı bulunamadı."
}

Set-Content $page $content -Encoding UTF8

if (Test-Path $css) {
  $cssContent = Get-Content $css -Raw -Encoding UTF8
  if ($cssContent -notmatch 'HASWOLF FINAL PWA FIX') {
    $cssContent += @'

/* HASWOLF FINAL PWA FIX */
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
  border: 1px solid rgba(217,170,74,.48);
  border-radius: .75rem;
  padding: .65rem .9rem;
  background: rgba(255,255,255,.035);
  color: #efc76b;
  white-space: nowrap;
}
.haswolf-download-button:disabled {
  opacity: .72;
  cursor: default;
}
'@
    Set-Content $css $cssContent -Encoding UTF8
  }
}

Write-Host ""
Write-Host "BASARILI: Giris Yap ve PWA kurulum butonu eklendi." -ForegroundColor Green
Write-Host "Yedek: $page.backup-$stamp"
