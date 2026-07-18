# HASWOLF V5.6 Kurulum

1. ZIP içeriğini mevcut projenin üzerine çıkar. `.env.local` dosyanı koru.
2. Supabase SQL Editor'da `supabase/haswolf_v5_6_rooms_and_admin.sql` dosyasını çalıştır.
3. Terminal:

```powershell
taskkill /F /IM node.exe
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
```

4. Tarayıcıda `Ctrl + Shift + R` yap.

## Kontrol
- `/admin/urunler` açılmalı ve ürün yönetimini göstermeli.
- Toplulukta Genel, Sunucular, Alım Satım ve Lonca Odaları ayrı görünmeli.
- Ephesus/Pergamon/Teos ses odaları ilgili sunucunun altında görünmeli.
- Yardımcı yöneticiler topluluk oda ve üye yönetimini kullanabilmeli.
- `/admin/loncalar` sayfasında lonca üyeleri ve davetler görünmeli.
