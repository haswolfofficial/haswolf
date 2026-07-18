# HASWOLF V5 Ultimate — Kurulum

Bu paket, yüklediğin güncel proje üzerinden hazırlanmıştır.

## İçerik
- Çift WhatsApp satın alma butonu kaldırıldı.
- Menüdeki ikinci Hesabım bağlantısı kaldırıldı.
- Hesabım / Çıkış Yap eşit görsel yapıya getirildi.
- Bildirimlerde ürün, sunucu, fiyat, indirim/etiket, tarih ve saat gösterimi.
- Bildirim sesi.
- Bugünün Favorisi / En Uygun Fiyat / Stok Azalıyor admin seçenekleri.
- Gerçek zamanlı görüntülenme ve favori sayısı altyapısı.
- Sadece admin için kayan canlı ziyaretçi widget'ı.
- 15 adet HASWOLF markalı otomatik ürün görseli (Item/Yang/DC, her biri 5).
- Görsel yükleme + hazır görsel + otomatik seçim.
- Hesap bazlı Premium üyelik altyapısı.
- Admin navigasyonu ve görünür yönetim sayfaları.
- Güvenlik Merkezi.
- Yapay Zekâ Moderasyon kuyruğu.
- Reklam ve Duyuru Yönetimi.
- Lonca, sohbet izinleri, audit log ve güvenlik tabloları.
- Mobil/tablet admin navigasyonu.

## 1. Dosyaları yerleştir
Bu ZIP içeriğini mevcut proje klasörünün üzerine çıkar. `.env.local` dosyanı koru.

## 2. Supabase
Supabase SQL Editor içinde şunu çalıştır:

`supabase/haswolf_v5_ultimate.sql`

## 3. Yerel test
```powershell
taskkill /F /IM node.exe
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
```

## 4. Üretim derlemesi
`.env.local` mevcutken:
```powershell
npm run build
```

## 5. GitHub branch'ini güncelle
Proje klasöründe:
```powershell
git branch --show-current
git status
git add .
git commit -m "HASWOLF V5 Ultimate admin premium moderation visuals"
git push origin haswolf-v4-premium
```

Branch farklı görünürse:
```powershell
git switch haswolf-v4-premium
git add .
git commit -m "HASWOLF V5 Ultimate admin premium moderation visuals"
git push origin haswolf-v4-premium
```

## Not
Build testi TypeScript ve derleme aşamasını başarıyla geçti. Bu çalışma ortamında `.env.local` bulunmadığı için prerender, `NEXT_PUBLIC_SUPABASE_URL tanımlı değil` noktasında durdu. Kendi proje klasöründeki mevcut `.env.local` ile bu hata oluşmamalıdır.
