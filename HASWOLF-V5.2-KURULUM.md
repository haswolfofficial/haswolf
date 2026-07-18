# HASWOLF V5.2 Kurulum

1. Dosyaları mevcut projenin üzerine çıkar. `.env.local` dosyasını koru.
2. Supabase SQL Editor içinde `supabase/haswolf_v5_ultimate.sql` dosyasının tamamını çalıştır.
3. Terminal: `taskkill /F /IM node.exe`
4. Terminal: `Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue`
5. Terminal: `npm install`
6. Terminal: `npm run dev`

## Yönetici üyeliği
Kurucu hesap `/admin/yetkililer` sayfasından en fazla iki yardımcı yönetici atayabilir. Yardımcı yöneticiler GitHub/kod erişimi dışında admin panelindeki tüm veri yönetim yetkilerine sahip olur. Kurucu hesabı kaldırılamaz.
