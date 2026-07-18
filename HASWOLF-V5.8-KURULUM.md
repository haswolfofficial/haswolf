# HASWOLF V5.8 Mobile / Tablet Final

## Yapılanlar
- Mobil ve tablette masaüstü ana navigasyonu kompakt iki satır hâlinde görünür.
- Ana Sayfa, Item, Karakter, Yang, DC, Sohbet, Admin, Premium, Dil ve Bildirimler aynı üst menüde yer alır.
- Sosyal medya bağlantıları sağdan açılan kompakt bir ray olarak eklendi.
- Sayfa açılışında ve normal tıklamalarda gereksiz bildirim sesi engellendi.
- Ses yalnızca yeni bildirim, genel duyuru ve yeni sohbet mesajında kullanılmaya devam eder.

## Kurulum
1. ZIP içeriğini proje klasörünün üzerine çıkar.
2. `.env.local` dosyanı koru.
3. Terminal:
   - `taskkill /F /IM node.exe`
   - `Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue`
   - `npm install`
   - `npm run dev`
4. Tarayıcıda `Ctrl + Shift + R` yap.

Bu sürüm yeni SQL gerektirmez.
