param(
  [string]$ProjectPath = "C:\Users\Lenovo\haswolf-v6"
)

$ErrorActionPreference = "Stop"

$pagePath = Join-Path $ProjectPath "app\page.tsx"
$cssPath  = Join-Path $ProjectPath "app\globals.css"
$newCss   = Join-Path $PSScriptRoot "globals-v6.css"
$stamp    = Get-Date -Format "yyyyMMdd-HHmmss"
$backup   = Join-Path $ProjectPath ".haswolf-backup-v6-ui-$stamp"

if (-not (Test-Path $pagePath)) { throw "Bulunamadi: $pagePath" }
if (-not (Test-Path $cssPath))  { throw "Bulunamadi: $cssPath" }
if (-not (Test-Path $newCss))   { throw "globals-v6.css betikle ayni klasorde olmali." }

New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item $pagePath (Join-Path $backup "page.tsx") -Force
Copy-Item $cssPath  (Join-Path $backup "globals.css") -Force

$page = Get-Content $pagePath -Raw -Encoding UTF8

function Replace-RegexRequired {
  param(
    [string]$Source,
    [string]$Pattern,
    [string]$Replacement,
    [string]$Name
  )

  $result = [regex]::Replace(
    $Source,
    $Pattern,
    $Replacement,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  if ($result -eq $Source) {
    throw "$Name bolumu bulunamadi. Dosya surumu beklenenden farkli."
  }

  return $result
}

# 1) Mobil sosyal ray paneline WhatsApp ekle.
if ($page -notmatch 'haswolf-mobile-social-rail__whatsapp') {
  $railPattern = '(<div className="haswolf-mobile-social-rail__panel">.*?)(\s*</div>\s*</aside>)'
  $railInsert = @'
$1
        <a
          className="haswolf-mobile-social-rail__whatsapp"
          href="https://wa.me/905010942080?text=Merhaba%20Haswolf%2C%20destek%20almak%20istiyorum."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp canlı destek"
        >
          <span className="haswolf-mobile-social-rail__whatsapp-icon">☎</span>
          <span>WhatsApp</span>
        </a>
$2
'@
  $page = Replace-RegexRequired $page $railPattern $railInsert "Mobil sosyal ray"
}

# 2) Ana navigasyonu istenen siraya getir.
$mainNavPattern = '<nav aria-label="Ana navigasyon" className="haswolf-main-nav">.*?</nav>'
$mainNavReplacement = @'
<nav aria-label="Ana navigasyon" className="haswolf-main-nav">
            <a href="#top"><span aria-hidden="true">⌂</span><span>Ana Sayfa</span></a>
            <button type="button" onClick={() => goToMarket("yang")}><YangIcon /><span>Yang</span></button>
            <button type="button" onClick={() => goToMarket("dc")}><span aria-hidden="true">💎</span><span>DC</span></button>
            <button type="button" onClick={() => goToMarket("item")}><span aria-hidden="true">⚔</span><span>Item</span></button>
            <button type="button" onClick={() => goToMarket("account")}><span aria-hidden="true">♟</span><span>Karakter</span></button>
            <a href="/topluluk" className="haswolf-chat-before-admin">
              <span aria-hidden="true">👥</span>
              <span>Sohbet</span>
            </a>
            {isAdmin && <a href="/admin"><span aria-hidden="true">🛡</span><span>Admin</span></a>}
            <PremiumBenefits />
            <NotificationCenter deals={products.map(({id,name,price,old_price,server,category,created_at,stock,is_daily_favorite,is_best_price,low_stock_alert})=>({id,name,price,old_price,server,category,created_at,stock,is_daily_favorite:Boolean(is_daily_favorite),is_best_price:Boolean(is_best_price),low_stock_alert:Boolean(low_stock_alert)}))} />
            <LanguageSelector />
          </nav>
'@
$page = Replace-RegexRequired $page $mainNavPattern $mainNavReplacement "Ana navigasyon"

# 3) Mobil cekmece navigasyonu.
$drawerNavPattern = '<nav className="haswolf-mobile-drawer__links" aria-label="Mobil menü">.*?</nav>'
$drawerNavReplacement = @'
<nav className="haswolf-mobile-drawer__links" aria-label="Mobil menü">
                <a href="#top"><span>⌂</span><span>Ana Sayfa</span></a>
                <button type="button" onClick={() => goToMarket("yang")}><span>◉</span><span>Yang</span></button>
                <button type="button" onClick={() => goToMarket("dc")}><span>💎</span><span>DC</span></button>
                <button type="button" onClick={() => goToMarket("item")}><span>⚔</span><span>Item</span></button>
                <button type="button" onClick={() => goToMarket("account")}><span>♟</span><span>Karakter</span></button>
                <a href="/topluluk"><span>✦</span><span>Sohbet</span></a>
              </nav>
'@
$page = Replace-RegexRequired $page $drawerNavPattern $drawerNavReplacement "Mobil cekmece"

# 4) Royale Online oyun alanini sunucu seciminin ustune ekle.
if ($page -notmatch 'haswolf-games-primary') {
  $serverSectionPattern = '(<section className="mx-auto max-w-\[1500px\] px-3 py-3 sm:px-5 sm:py-4 lg:px-6">)'
  $gamesReplacement = @'
      <section className="haswolf-games-primary" aria-labelledby="haswolf-games-title">
        <div className="haswolf-games-primary__heading">
          <strong id="haswolf-games-title">🎮 OYUNLAR</strong>
          <small>HASWOLF ana oyun pazarı</small>
        </div>
        <div className="haswolf-games-primary__card">
          <span className="haswolf-games-primary__logo">R</span>
          <span>
            <strong>Royale Online</strong>
            <small>Item, Yang, DC ve karakter pazarı</small>
          </span>
          <span className="haswolf-games-primary__status">AKTİF</span>
        </div>
      </section>

      $1
'@
  $page = Replace-RegexRequired $page $serverSectionPattern $gamesReplacement "Sunucu bolumu"
}

# 5) Eski yakinda oyun listesini kaldir.
$page = [regex]::Replace(
  $page,
  '\s*<details className="haswolf-games-drawer">.*?</details>',
  '',
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

# 6) Market sekmelerini Yang -> DC -> Item -> Karakter yap.
$tabsPattern = '<div className="haswolf-market-tabs[^"]*">.*?</div>\s*</section>'
$tabsReplacement = @'
<div className="haswolf-market-tabs grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-2 md:gap-3 md:p-3">
          <button
            onClick={() => goToMarket("yang")}
            className={`min-w-0 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "yang"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            🪙 YANG MARKET
          </button>

          <button
            onClick={() => goToMarket("dc")}
            className={`min-w-0 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "dc"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            💎 DC SATIŞ
          </button>

          <button
            onClick={() => goToMarket("item")}
            className={`min-w-0 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "item"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            ⚔ ITEM MARKET
          </button>

          <button
            onClick={() => goToMarket("account")}
            className={`min-w-0 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "account"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            👤 KARAKTER
          </button>
        </div>
      </section>
'@
$page = Replace-RegexRequired $page $tabsPattern $tabsReplacement "Market sekmeleri"

Set-Content $pagePath $page -Encoding UTF8
Copy-Item $newCss $cssPath -Force

Write-Host ""
Write-Host "HASWOLF V6 UI paketi basariyla uygulandi." -ForegroundColor Green
Write-Host "Yedek klasoru: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Siradaki komutlar:" -ForegroundColor Cyan
Write-Host "  taskkill /F /IM node.exe"
Write-Host "  Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue"
Write-Host "  npm run build"
