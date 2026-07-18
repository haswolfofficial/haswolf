import LegalPage from "@/components/LegalPage";

const sections = [
  {
    "title": "İşlenen veri kategorileri",
    "body": "Google girişinde kullanıcı kimliği, e-posta ve sağlayıcının sunduğu temel profil bilgileri; misafir girişinde anonim kullanıcı kimliği, otomatik mahlas ve güvenlik kayıtları işlenebilir.",
    "points": [
      "Sohbet mesajları ve işlem kayıtları hizmetin sunulması amacıyla saklanabilir.",
      "Cihaz, tarayıcı, zaman damgası ve hata kayıtları güvenlik ve performans için kullanılabilir.",
      "Ödeme bilgileri doğrudan HASWOLF tarafından tutulmuyorsa ödeme sağlayıcının politikaları geçerlidir."
    ]
  },
  {
    "title": "IP adresi yaklaşımı",
    "body": "Misafir güvenliğinde ham IP adresinin veritabanında saklanması yerine, sunucu tarafında gizli bir salt ile geri döndürülemez kriptografik özet üretilir.",
    "points": [
      "IP özeti güvenlik ve ban kontrolü için kullanılır.",
      "VPN, mobil ağ ve ortak bağlantılar nedeniyle IP tek başına kesin kimlik değildir.",
      "Ham IP, altyapı sağlayıcılarının kısa süreli teknik loglarında kendi politikalarına göre bulunabilir."
    ]
  },
  {
    "title": "Verilerin kullanım amaçları",
    "body": "Kimlik doğrulama, topluluk güvenliği, çekiliş katılımı, mükerrer kayıt önleme, destek, hata analizi ve hizmet geliştirme amaçlarıyla veri işlenebilir."
  },
  {
    "title": "Saklama ve silme",
    "body": "Veriler amaç için gerekli süre boyunca tutulur. Yasal zorunluluklar, güvenlik soruşturmaları ve uyuşmazlık kayıtları daha uzun süre saklanabilir.",
    "points": [
      "Kullanıcı düzeltme veya silme talebini iletişim kanallarından iletebilir.",
      "Silme talebi, yasal saklama yükümlülüğü olan kayıtları otomatik olarak ortadan kaldırmaz.",
      "Anonimleştirilen kayıtlar kimliğe bağlanmadan istatistik amaçlı korunabilir."
    ]
  },
  {
    "title": "Hizmet sağlayıcılar",
    "body": "Supabase, Vercel, LiveKit ve diğer teknik altyapı sağlayıcıları hizmetin sunulması için veri işleyen olarak kullanılabilir. Her sağlayıcının kendi güvenlik ve gizlilik yükümlülükleri bulunur."
  },
  {
    "title": "Haklar ve iletişim",
    "body": "Erişim, düzeltme, silme, itiraz ve bilgi talebi için İletişim veya Sorun Bildir sayfası kullanılabilir."
  }
];

export default function Page() {
  return (
    <LegalPage
      eyebrow="GİZLİLİK VE VERİ KORUMA"
      title="Gizlilik, Kişisel Veriler ve Güvenlik Politikası"
      intro="HASWOLF, hizmetin çalışması, kullanıcı güvenliği, dolandırıcılığın önlenmesi ve yasal yükümlülükler için gerekli asgari veriyi işler."
      sections={sections}
    />
  );
}
