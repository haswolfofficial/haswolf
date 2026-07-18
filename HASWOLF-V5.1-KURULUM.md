# HASWOLF V5.1 Active Admin Kurulumu

## 1) Dosyalar
ZIP içindeki dosyaları mevcut HASWOLF proje klasörünün üzerine çıkar. `.env.local` dosyanı koru.

## 2) Supabase
Supabase SQL Editor içinde `supabase/haswolf_v5_ultimate.sql` dosyasının tamamını yeniden çalıştır. Komutlar `IF NOT EXISTS` kullanır; mevcut V5 kurulumu üzerine güvenle uygulanabilir.

Bu SQL şunları etkinleştirir:
- Premium üyelik verme/kaldırma
- Chat ban tarihleri
- Lonca rozet, renk, açıklama ve logo alanları
- Adminin profil, sohbet odası, lonca, reklam ve bildirim tablolarını yönetmesi

## 3) Temiz başlangıç
```powershell
taskkill /F /IM node.exe
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
```

## 4) Kontrol
- `/admin/premium`: Kullanıcının yanında 30/90/180/365 Gün, Süresiz ve Kaldır seçenekleri.
- `/admin/loncalar`: Lonca oluşturma, kapatma, silme ve özel oda yönetimi.
- `/admin/sohbet`: Oda oluşturma, yavaş mod, kilitleme, silme; mahlasa basınca hızlı chat ban menüsü.
- `/admin/reklamlar`: Banner, pop-up, yan bildirim ve geri sayım kampanyası yayınlama.
- Ana sayfa: Premium avantaj paneli, canlı bildirim zamanı, düzeltilmiş kategori çekmecesi ve Oyunlar/Yakında paneli.
- Ürün görselleri: Item, Yang ve DC için daha dolu, parlak ve 3B hissi veren 15 SVG.

## 5) GitHub
```powershell
git add .
git commit -m "HASWOLF V5.1 active professional admin panels"
git push origin haswolf-v4-premium
```
