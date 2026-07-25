HASWOLF SES + FAVORİLER + MİSAFİR YÖNETİMİ PAKETİ V2

Kapsam:
- Aynı LiveKit ses izinin birden fazla audio elementiyle çalmasını engeller.
- Eski/çoğalmış audio elementlerini temizler.
- Yankı önleme, gürültü azaltma ve otomatik kazanç denetimini korur.
- Ses odasındaki katılımcıları listeler.
- Yöneticiye misafir kullanıcıyı odadan çıkarıp hesabını silme düğmesi verir.
- LiveKit kimliğini Supabase kullanıcı kimliğiyle eşleştirir.
- VoiceRoom içindeki bozuk Türkçe metinleri UTF-8 olarak düzeltir.
- Hesabım > Favorilerim bölümünde gerçek favori ürünleri gösterir.
- Favoriden kaldırma özelliği ekler.

KURULUM
1) ZIP'i aç.
2) apply-haswolf-complete-fix.ps1 dosyasını C:\Users\Lenovo\haswolf-v6 klasörüne kopyala.
3) VS Code PowerShell terminalinde:

cd C:\Users\Lenovo\haswolf-v6
powershell -ExecutionPolicy Bypass -File .\apply-haswolf-complete-fix.ps1
npm run build

Build başarılı olursa:

git add .
git commit -m "Fix voice echo favorites guest moderation and UTF-8"
git push origin haswolf-v6-professional

NOT
- Script çalışmadan önce değiştireceği dosyaların tarihli yedeğini oluşturur.
- İki cihaz yan yana test edilirken akustik geri besleme yine oluşabilir; ancak bu paket yazılımsal 3-4 kez oynatma sorununu engeller.


V2 DÜZELTMESİ
- publication.trackSid veya track.sid boş geldiğinde TypeScript hatası vermez.
- TrackUnsubscribed temizliği SDK içindeki mediaStream alanına bağımlı değildir.
- Önceki paketin tüm özellikleri bu paketin içindedir; eski paketi tekrar çalıştırman gerekmez.
