param(
  [string]$ProjectPath = "C:\Users\Lenovo\haswolf-v6"
)

$ErrorActionPreference = "Stop"

$pagePath = Join-Path $ProjectPath "app\page.tsx"
$cssPath  = Join-Path $ProjectPath "app\globals.css"
$newCss   = Join-Path $PSScriptRoot "globals-v6.css"
$stamp    = Get-Date -Format "yyyyMMdd-HHmmss"
$backup   = Join-Path $ProjectPath ".haswolf-backup-v6-ui-$stamp"

if (-not (Test-Path $pagePath)) { throw "Bulunamadı: $pagePath" }
if (-not (Test-Path $cssPath))  { throw "Bulunamadı: $cssPath" }
if (-not (Test-Path $newCss))   { throw "globals-v6.css betikle aynı klasörde olmalı." }

New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item $pagePath (Join-Path $backup "page.tsx") -Force
Copy-Item $cssPath  (Join-Path $backup "globals.css") -Force

$page = Get-Content $pagePath -Raw -Encoding UTF8

function Replace-Required {
  param([string]$Source,[string]$Old,[string]$New,[string]$Name)
  if (-not $Source.Contains($Old)) {
    throw "$Name bölümü bulunamadı. Dosya sürümü beklenenden farklı."
  }
  return $Source.Replace($Old,$New)
}

# 1) Sağ sosyal raya WhatsApp ekle.
$oldRail = @'
        {headerSocials.map((social) => (
          <a
            key={social.name}
            href={social.href}
            target={social.href.startsWith("http") ? "_blank" : undefined}
            rel={social.href.startsWith("http") ? "noreferrer" : undefined}
            aria-label={social.label}
          >
            <SocialIcon name={social.name} />
            <span>{social.label}</span>
          </a>
        ))}
'@

$newRail = @'
        {headerSocials.map((social) => (
          <a
            key={social.name}
            href={social.href}
            target={social.href.startsWith("http") ? "_blank" : undefined}
            rel={social.href.startsWith("http") ? "noreferrer" : undefined}
            aria-label={social.label}
          >
            <SocialIcon name={social.name} />
            <span>{social.label}</span>
          </a>
        ))}
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
'@
$page = Replace-Required $page $oldRail $newRail "Mobil sosyal ray"

# 2) Ana navigasyon sırası.
$oldNav = @'
            <a href="#top"><span aria-hidden="true">⌂</span><span>Ana Sayfa</span></a>
            <button type="button" onClick={() => goToMarket("item")}><span aria-hidden="true">⚔</span><span>Item</span></button>
            <button type="button" onClick={() => goToMarket("account")}><span aria-hidden="true">♟</span><span>Karakter</span></button>
            <button type="button" onClick={() => goToMarket("yang")}><YangIcon /><span>Yang</span></button>
            <button type="button" onClick={() => goToMarket("dc")}><span aria-hidden="true">💎</span><span>DC Satış</span></button>
            <a href="/topluluk" className="haswolf-chat-before-admin">
              <span aria-hidden="true">👥</span>
              <span>Sohbet Odaları</span>
            </a>
            {isAdmin && <a href="/admin"><span aria-hidden="true">🛡</span><span>Admin</span></a>}
            <PremiumBenefits />
            <LanguageSelector />
            <NotificationCenter deals={products.map(({id,name,price,old_price,server,category,created_at,stock,is_daily_favorite,is_best_price,low_stock_alert})=>({id,name,price,old_price,server,category,created_at,stock,is_daily_favorite:Boolean(is_daily_favorite),is_best_price:Boolean(is_best_price),low_stock_alert:Boolean(low_stock_alert)}))} />
'@

$newNav = @'
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
'@
$page = Replace-Required $page $oldNav $newNav "Ana navigasyon"

# 3) Mobil çekmece sırası.
$oldDrawer = @'
                <a href="#top"><span>⌂</span><span>Ana Sayfa</span></a>
                <button type="button" onClick={() => goToMarket("item")}><span>⚔</span><span>Item</span></button>
                <button type="button" onClick={() => goToMarket("account")}><span>♟</span><span>Karakter</span></button>
                <button type="button" onClick={() => goToMarket("yang")}><span>◉</span><span>Yang</span></button>
                <button type="button" onClick={() => goToMarket("dc")}><span>💎</span><span>DC Satış</span></button>
                <a href="/topluluk"><span>✦</span><span>Sohbet Odaları</span></a>
'@
$newDrawer = @'
                <a href="#top"><span>⌂</span><span>Ana Sayfa</span></a>
                <button type="button" onClick={() => goToMarket("yang")}><span>◉</span><span>Yang</span></button>
                <button type="button" onClick={() => goToMarket("dc")}><span>💎</span><span>DC</span></button>
                <button type="button" onClick={() => goToMarket("item")}><span>⚔</span><span>Item</span></button>
                <button type="button" onClick={() => goToMarket("account")}><span>♟</span><span>Karakter</span></button>
                <a href="/topluluk"><span>✦</span><span>Sohbet</span></a>
'@
$page = Replace-Required $page $oldDrawer $newDrawer "Mobil çekmece"

# 4) Oyunlar alanını sunucu seçiminin üstüne ekle.
$serverMarker = @'
      <section className="mx-auto max-w-[1500px] px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
'@
$gamesBlock = @'
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

      <section className="mx-auto max-w-[1500px] px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
'@
$page = Replace-Required $page $serverMarker $gamesBlock "Sunucu bölümü"

# 5) Eski YAKINDA oyun çekmecesini kaldır.
$oldGamesDrawer = @'
            <details className="haswolf-games-drawer">
              <summary><span>🎮 OYUNLAR</span><small>8 yeni pazar</small><i>▼</i></summary>
              <div>{["Mobile2","Wild Rift","Mobile Legends: Bang Bang","Knight Online","Silkroad Online","World of Warcraft","Valorant","PUBG Mobile"].map((game) => (
                <button type="button" key={game} disabled><span>{game}</span><b>YAKINDA</b></button>
              ))}</div>
            </details>

'@
$page = Replace-Required $page $oldGamesDrawer "" "Eski oyunlar çekmecesi"

# 6) Market sekmelerini Yang → DC → Item → Karakter sırasına al.
$tabsPattern = '(?s)          <button\s+onClick=\{\(\) => goToMarket\("item"\)\}.*?          </button>\s+\r?\n\r?\n          <button\s+onClick=\{\(\) => goToMarket\("yang"\)\}.*?          </button>\s+\r?\n\r?\n          <button\s+onClick=\{\(\) => goToMarket\("dc"\)\}.*?          </button>\s+\r?\n\r?\n          <button\s+onClick=\{\(\) => goToMarket\("account"\)\}.*?          </button>'

$tabsReplacement = @'
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
'@

$newPage = [regex]::Replace($page, $tabsPattern, $tabsReplacement, 1)
if ($newPage -eq $page) { throw "Market sekmeleri bölümü bulunamadı." }
$page = $newPage

Set-Content $pagePath $page -Encoding UTF8
Copy-Item $newCss $cssPath -Force

Write-Host ""
Write-Host "HASWOLF V6 UI paketi uygulandı." -ForegroundColor Green
Write-Host "Yedek: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Şimdi çalıştır:" -ForegroundColor Cyan
Write-Host "  Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue"
Write-Host "  npm run build"
