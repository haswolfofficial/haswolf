import LegalPage from "@/components/LegalPage";

const sections = [
  {
    "title": "İlan doğruluğu",
    "body": "İlan adı, sunucu, ürün niteliği, stok, fiyat ve teslimat süresi gerçeğe uygun olmalıdır."
  },
  {
    "title": "Ödeme güvenliği",
    "body": "Ödeme talimatını yalnızca resmî destek kanalından doğrula. Farklı isimli, şüpheli veya son dakika değiştirilen hesaba ödeme yapma."
  },
  {
    "title": "Teslimat kaydı",
    "body": "Teslimat sürecinde mesaj, ekran görüntüsü ve işlem saatini sakla. Oyundaki teslimatın doğru karaktere yapıldığını kontrol et."
  },
  {
    "title": "Dolandırıcılık belirtileri",
    "body": "Aşırı düşük fiyat, acil ödeme baskısı, platform dışına yönlendirme, kimlik taklidi ve doğrulama reddi risk işaretidir."
  },
  {
    "title": "Uyuşmazlık çözümü",
    "body": "Sorun yaşandığında ödeme dekontu, konuşmalar, ilan bağlantısı ve teslimat kanıtıyla destek talebi oluştur."
  }
];

export default function Page() {
  return (
    <LegalPage
      eyebrow="ALICI VE SATICI GÜVENLİĞİ"
      title="Güvenli Ticaret Rehberi"
      intro="HASWOLF pazarında işlem yaparken doğrulama, kayıt ve resmî iletişim kanalları temel güvenlik katmanlarıdır."
      sections={sections}
    />
  );
}
