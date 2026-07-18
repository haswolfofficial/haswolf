param(
  [string]$ProjectPath = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectPath

function Backup-File([string]$Path) {
  if (!(Test-Path $Path)) { throw "Dosya bulunamadı: $Path" }
  $backupRoot = Join-Path $ProjectPath ".haswolf-backup-sprint1-fix"
  $target = Join-Path $backupRoot $Path
  New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
  if (!(Test-Path $target)) { Copy-Item $Path $target -Force }
}

function Write-Utf8([string]$Path, [string]$Content) {
  [System.IO.File]::WriteAllText((Join-Path $ProjectPath $Path), $Content, [System.Text.UTF8Encoding]::new($false))
}

$files = @(
  "app/page.tsx",
  "app/globals.css",
  "components/LanguageSelector.tsx",
  "components/AutoTranslate.tsx",
  "components/NotificationCenter.tsx"
)
$files | ForEach-Object { Backup-File $_ }

# Önceki script component dosyalarını değiştirmiş olabilir; bunlar mevcutsa dokunmuyoruz.
# Dil ve bildirim dosyaları yoksa hata vermek yerine devam etmiyoruz.
foreach ($required in @("components/LanguageSelector.tsx","components/AutoTranslate.tsx","components/NotificationCenter.tsx")) {
  if (!(Test-Path $required)) { throw "Eksik dosya: $required" }
}

$pagePath = Join-Path $ProjectPath "app/page.tsx"
$page = [System.IO.File]::ReadAllText($pagePath)

# 1) Header CTA daha önce eklenmediyse ekle
if (!$page.Contains("haswolf-header-trade")) {
  $needle = "<WolfLogo />"
  $insert = @'
<WolfLogo />

            <div className="haswolf-header-trade">
              <button type="button" onClick={() => goToMarket("item")} className="haswolf-header-trade__buy">
                <span aria-hidden="true">🛒</span><span><strong>Bizden Satın Al</strong><small>Market ürünlerini incele</small></span>
              </button>
              <button type="button" onClick={() => openWhatsApp("Merhaba Haswolf, Item, Yang veya DC satmak istiyorum. Teklif almak istiyorum.")} className="haswolf-header-trade__sell">
                <span aria-hidden="true">💰</span><span><strong>Bize Sat</strong><small>Hızlı teklif al</small></span>
              </button>
            </div>
'@
  if (!$page.Contains($needle)) { throw "Header logo alanı bulunamadı." }
  $page = $page.Replace($needle, $insert)
}

# 2) Hero büyük kartları daha önce kaldırılmadıysa değiştir
if ($page.Contains("haswolf-trade-card haswolf-trade-card--buy")) {
  $start = $page.IndexOf('<div className="haswolf-trade-actions">')
  if ($start -lt 0) { throw "Hero ticaret alanı başlangıcı bulunamadı." }
  $endNeedle = '</div>'
  # trade-actions içindeki kapanışı, çekiliş linkinden sonraki ilk div olarak bul
  $rafflePos = $page.IndexOf('haswolf-trade-actions__raffle', $start)
  if ($rafflePos -lt 0) { throw "Hero çekiliş bağlantısı bulunamadı." }
  $end = $page.IndexOf($endNeedle, $rafflePos)
  if ($end -lt 0) { throw "Hero ticaret alanı sonu bulunamadı." }
  $end += $endNeedle.Length
  $replacement = @'
<div className="haswolf-hero-quick-links">
                  <button type="button" onClick={() => goToMarket("item")}>Markete Git</button>
                  <a href="/cekilis">★ Çekiliş Merkezi</a>
                </div>
'@
  $page = $page.Substring(0,$start) + $replacement + $page.Substring($end)
}

# 3) Sunucu kartı tek butonunu bulup çift butona çevir
if (!$page.Contains("haswolf-server-actions")) {
  $sellTextPos = $page.IndexOf("BİZE SAT")
  if ($sellTextPos -lt 0) { $sellTextPos = $page.IndexOf("Bize Sat") }
  if ($sellTextPos -lt 0) { throw "Sunucu Bize Sat butonu bulunamadı." }

  $buttonStart = $page.LastIndexOf("<button", $sellTextPos)
  $buttonEnd = $page.IndexOf("</button>", $sellTextPos)
  if ($buttonStart -lt 0 -or $buttonEnd -lt 0) { throw "Sunucu buton sınırları bulunamadı." }
  $buttonEnd += "</button>".Length

  $oldButton = $page.Substring($buttonStart, $buttonEnd - $buttonStart)
  if (!$oldButton.Contains("server.name") -or !$oldButton.Contains("openWhatsApp")) {
    # İlk BİZE SAT başka yerdeyse server kartı olanı regex ile bul
    $pattern = '(?s)<button[^>]*onClick=\{\(\)\s*=>\s*openWhatsApp\(`Merhaba Haswolf,\s*\$\{server\.name\}.*?</button>'
    $m = [regex]::Match($page, $pattern)
    if (!$m.Success) { throw "Sunucuya ait Bize Sat butonu bulunamadı." }
    $buttonStart = $m.Index
    $buttonEnd = $m.Index + $m.Length
  }

  $replacement = @'
<div className="haswolf-server-actions mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedServer(server.name);
                        goToMarket("yang");
                      }}
                      className="haswolf-buy-button"
                    >
                      BİZDEN SATIN AL
                    </button>
                    <button
                      type="button"
                      onClick={() => openWhatsApp(`Merhaba Haswolf, ${server.name} sunucusunda Yang veya oyun içi varlık satmak istiyorum.`)}
                      className="haswolf-sell-button"
                    >
                      BİZE SAT
                    </button>
                  </div>
'@
  $page = $page.Substring(0,$buttonStart) + $replacement + $page.Substring($buttonEnd)
}

# 4) Yang kartındaki metin
$page = $page -replace '>\s*WhatsApp\s*</button>', '>WhatsApp ile Satın Al</button>'

Write-Utf8 "app/page.tsx" $page

# 5) CSS kuralları yoksa ekle
$cssPath = Join-Path $ProjectPath "app/globals.css"
$css = [System.IO.File]::ReadAllText($cssPath)
$marker = "/* HASWOLF V4 SPRINT 1 PREMIUM OVERRIDES */"
if (!$css.Contains($marker)) {
$css += @'

/* HASWOLF V4 SPRINT 1 PREMIUM OVERRIDES */
.haswolf-topbar { gap: 1rem; }
.haswolf-header-trade { display:none;align-items:stretch;gap:.55rem;margin-inline:auto; }
.haswolf-header-trade button {
  display:flex;align-items:center;gap:.65rem;min-width:10.75rem;min-height:3.35rem;
  padding:.65rem .85rem;border-radius:.9rem;border:1px solid rgba(217,170,74,.34);
  background:linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.025));
  color:#f2f2f2;text-align:left;box-shadow:0 10px 30px rgba(0,0,0,.22);
  transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;
}
.haswolf-header-trade button:hover { transform:translateY(-2px);border-color:rgba(239,198,104,.75);box-shadow:0 14px 38px rgba(0,0,0,.38),0 0 24px rgba(217,170,74,.08); }
.haswolf-header-trade button>span:first-child{font-size:1.3rem}
.haswolf-header-trade strong,.haswolf-header-trade small{display:block}
.haswolf-header-trade strong{font-size:.76rem;color:#efc668}
.haswolf-header-trade small{margin-top:.12rem;font-size:.62rem;color:#929696}
.haswolf-header-trade__buy{border-color:rgba(44,190,103,.42)!important;background:linear-gradient(180deg,rgba(14,83,43,.35),rgba(4,25,14,.38))!important}
.haswolf-header-trade__sell{background:linear-gradient(180deg,rgba(141,91,15,.26),rgba(35,22,5,.5))!important}

.haswolf-hero-quick-links{display:flex;flex-wrap:wrap;gap:.65rem}
.haswolf-hero-quick-links button,.haswolf-hero-quick-links a{min-height:2.85rem;display:inline-flex;align-items:center;justify-content:center;border-radius:.75rem;padding:.65rem 1rem;font-weight:800;font-size:.78rem}
.haswolf-hero-quick-links button{background:linear-gradient(135deg,#e6b951,#9b6818);color:#080808}
.haswolf-hero-quick-links a{border:1px solid rgba(217,170,74,.52);color:#e9bf68;background:rgba(0,0,0,.28)}

.haswolf-server-actions{display:grid;grid-template-columns:1fr 1fr;gap:.55rem}
.haswolf-server-actions button{min-height:2.65rem;border-radius:.7rem;padding:.55rem .65rem;font-size:.7rem;font-weight:950;transition:transform .2s ease,filter .2s ease,box-shadow .2s ease}
.haswolf-server-actions button:hover{transform:translateY(-2px);filter:brightness(1.08)}
.haswolf-buy-button{border:1px solid rgba(48,197,105,.6);color:#d9ffe7;background:linear-gradient(135deg,#106b36,#063a1d);box-shadow:0 8px 24px rgba(20,155,74,.14)}

.haswolf-language-menu,.haswolf-notification-root{position:relative}
.haswolf-language-menu__trigger{min-height:3rem;display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.55rem .72rem;border:1px solid rgba(217,170,74,.34);border-radius:.8rem;background:rgba(255,255,255,.035);color:#f1cf85;font-size:.75rem}
.haswolf-language-menu__panel{position:absolute;z-index:120;top:calc(100% + .65rem);right:0;width:min(21rem,calc(100vw - 1rem));padding:.75rem;border:1px solid rgba(217,170,74,.42);border-radius:1rem;background:rgba(7,9,9,.98);box-shadow:0 24px 80px rgba(0,0,0,.72);backdrop-filter:blur(24px)}
.haswolf-language-menu__panel header{padding:.35rem .35rem .7rem;border-bottom:1px solid rgba(255,255,255,.08)}
.haswolf-language-menu__panel header strong,.haswolf-language-menu__panel header small{display:block}
.haswolf-language-menu__panel header small{margin-top:.2rem;color:#858989;font-size:.68rem}
.haswolf-language-menu__panel>div{display:grid;grid-template-columns:1fr 1fr;gap:.35rem;margin-top:.6rem}
.haswolf-language-menu__panel button{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.5rem;padding:.65rem;border-radius:.7rem;color:#d5d7d7;text-align:left;font-size:.73rem}
.haswolf-language-menu__panel button:hover,.haswolf-language-menu__panel button.is-active{background:rgba(217,170,74,.13);color:#f1c96f}
.haswolf-language-menu__panel button b{color:#777;font-size:.62rem}

.haswolf-notification-panel{position:absolute!important;top:calc(100% + .65rem)!important;right:0!important;left:auto!important;width:min(23rem,calc(100vw - 1rem))!important;max-height:min(30rem,72vh)!important;border-radius:1rem!important;overflow:hidden!important}
.haswolf-notification-panel header{padding:.85rem 1rem!important}
.haswolf-notification-panel header h2{font-size:.95rem!important}
.haswolf-notification-list{max-height:23rem!important;overflow:auto!important;padding:.5rem!important}
.haswolf-notification-list>button{min-height:auto!important;padding:.7rem!important;border-radius:.75rem!important}
.haswolf-sale-toast{max-width:min(20rem,calc(100vw - 1rem))!important}

@media(min-width:1180px){.haswolf-header-trade{display:flex}}
@media(max-width:640px){.haswolf-server-actions{grid-template-columns:1fr}.haswolf-language-menu__panel>div{grid-template-columns:1fr}}
'@
Write-Utf8 "app/globals.css" $css
}

Write-Host ""
Write-Host "HASWOLF v4 Sprint 1 düzeltmesi başarıyla uygulandı." -ForegroundColor Green
Write-Host "Yedek: .haswolf-backup-sprint1-fix" -ForegroundColor Yellow
Write-Host "Şimdi npm run dev çalıştır." -ForegroundColor Cyan
