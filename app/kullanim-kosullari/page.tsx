import LegalPage from "@/components/LegalPage";

const sections = [
  {
    "title": "Hizmet kapsamı",
    "body": "HASWOLF; market, sohbet, çekiliş, içerik ve destek özellikleri sunar. Özellikler güvenlik, bakım veya geliştirme nedeniyle değiştirilebilir."
  },
  {
    "title": "Hesap sorumluluğu",
    "body": "Kullanıcı, hesabının güvenliğinden ve hesabı üzerinden yapılan işlemlerden sorumludur.",
    "points": [
      "Şifre ve oturum bağlantıları paylaşılmamalıdır.",
      "Şüpheli girişler derhâl destek kanalına bildirilmelidir.",
      "Misafir hesapları kalıcı sahiplik garantisi sağlamaz."
    ]
  },
  {
    "title": "Yasak faaliyetler",
    "body": "Yetkisiz erişim, zararlı kod, açık sömürüsü, otomasyonla kötüye kullanım, dolandırıcılık ve platformun çalışmasını engelleme yasaktır."
  },
  {
    "title": "Çekilişler",
    "body": "Çekiliş koşulları her kampanya kartında ayrıca belirtilir. Mükerrer veya sahte katılım geçersiz sayılabilir. Kazananın süre içinde dönüş yapmaması hâlinde yedek kazanan seçilebilir."
  },
  {
    "title": "Sorumluluk sınırı",
    "body": "HASWOLF, makul güvenlik önlemleri alır; ancak üçüncü taraf kesintileri, kullanıcıların platform dışı işlemleri ve mücbir sebeplerden kaynaklanan zararlar için yasal sınırlar içinde sorumluluk sınırlaması uygular."
  },
  {
    "title": "Değişiklikler",
    "body": "Koşullar güncellenebilir. Önemli değişiklikler platform üzerinden duyurulur; hizmeti kullanmaya devam etmek güncel metnin kabulü anlamına gelir."
  }
];

export default function Page() {
  return (
    <LegalPage
      eyebrow="PLATFORM KOŞULLARI"
      title="Kullanım Koşulları"
      intro="HASWOLF platformunu kullanan herkes bu koşulları, topluluk kurallarını ve ilgili politika metinlerini kabul eder."
      sections={sections}
    />
  );
}
