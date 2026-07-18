# HASWOLF V5.7 — Duyuru Yayını, Kompakt Kanallar ve Bildirim Yönetimi

## Yapılanlar
- Duyurular odasına gönderilen yeni mesaj tüm açık HASWOLF sayfalarında ekran ortasında duyuru kartı olarak gösterilir.
- Duyuru kartı ses çalar; kullanıcı sesi kalıcı olarak kapatabilir.
- Kapatma düğmesi 5 saniyelik geri sayımdan sonra açılır.
- Kapatılan duyuru aynı tarayıcıda tekrar gösterilmez.
- Son 24 saatteki kapatılmamış son duyuru sayfa yenilenince gösterilir.
- Topluluk kanal menüsü daha kompakt hale getirildi.
- Bildirim ve Premium panellerinin kapatma düğmeleri belirgin, dolu ve yazıdan uzak hale getirildi.
- Admin Bildirim Yönetimi ekranında bildirim yayından kaldırma, yeniden yayınlama ve kalıcı silme aktif edildi.
- Silinen bildirim işlemi denetim günlüğüne kaydedilir.

## Kurulum
1. ZIP içindeki dosyaları mevcut projenin üzerine kopyala.
2. `.env.local` dosyanı koru.
3. Bu güncelleme yeni SQL gerektirmez.
4. Terminal:

```powershell
taskkill /F /IM node.exe
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
```

5. Tarayıcıda `Ctrl + Shift + R` yap.

## Test
- Topluluk > Duyurular odasına yeni mesaj gönder.
- Başka sekmede ana sayfayı açık tut; ortada kart ve ses çıkmalı.
- İlk 5 saniye sayaç, sonra aktif `✕` görünmeli.
- Ses kapatılınca sonraki duyurularda ses çalmamalı.
- `/admin/bildirimler` ekranında bir bildirimi pasife al, yeniden yayınla ve test kaydını sil.
