# HASWOLF Professional V8 – Değişen Dosyalar

Bu paket, mevcut `haswolf-v6` kök dizinine kopyalanacak değişen dosyaları içerir.

## Kurulum
1. Dosyaları proje köküne, klasör yapısını koruyarak kopyala.
2. Supabase SQL Editor içinde `supabase/haswolf_v8_professional_platform.sql` dosyasını çalıştır.
3. `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, Supabase URL ve publishable/service-role anahtarlarının tanımlı olduğunu doğrula.
4. `npm run build` çalıştır ve yayınla.

## Eklenenler
- Login sonrası önceki sayfaya güvenli dönüş.
- LiveKit konuşma yetkisi: varsayılan üye mikrofon yayını yapamaz; admin/kurucu yetki verir.
- Kick, ban, sustur, konuşma yetkisi verme/alma ve moderasyon kayıtları.
- Mobil ses katılımcı yönetim butonları ve z-index düzeltmeleri.
- Supabase `notification_preferences` ve `moderation_actions` tabloları.

## Android Foreground Service Notu
Web/PWA katmanında Media Session ve kalıcı ses oturumu zaten kullanılıyor. Gerçek Android `ForegroundService`, yalnızca native Android/Capacitor/TWA kabuğunda oluşturulabilir; tarayıcı JavaScript'i tek başına Android servis API'sine erişemez.
