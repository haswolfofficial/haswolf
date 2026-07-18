# HASWOLF V5.4 — Ürün Görsel Kütüphanesi

Bu paket V5.3 üzerindeki tüm yönetim, Premium, lonca, sohbet, reklam, bildirim, güvenlik ve responsive düzenlemeleri korur.

## Bu sürümde değişenler

- Item, Yang ve DC için beşer benzer görsel yerine üçer tamamen farklı hazır görsel kullanılır.
- Toplam dokuz hazır ürün görseli vardır.
- Görsellerin altındaki `ELITE`, sıra numarası ve kategori metinleri kaldırılmıştır.
- Görsellerde yalnızca üst bölümde `HASWOLF` markası bulunur.
- Item görselleri: kurt/silah arması, savaş mührü, zırhlı kalkan.
- Yang görselleri: altın yığını, hazine kesesi, büyük Yang parası.
- DC görselleri: kristal elmas, kesimli mavi taş, enerji mührü.
- Hazır görsel seçici her kategoride yalnızca üç seçenek gösterir.
- Otomatik seçim yeni üçlü kütüphaneyi kullanır.

## Kurulum

1. ZIP içeriğini mevcut proje klasörünün üzerine çıkar.
2. `.env.local` dosyanı koru.
3. Terminalde:

```powershell
taskkill /F /IM node.exe
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
```

4. Tarayıcıda `Ctrl + Shift + R` yap.

Bu görsel güncellemesi yeni bir SQL çalıştırmayı gerektirmez. Önceki V5 SQL kurulumu geçerlidir.
