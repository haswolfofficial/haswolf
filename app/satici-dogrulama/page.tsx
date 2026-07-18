import LegalPage from "@/components/LegalPage";

const sections = [
  {
    "title": "Başvuru",
    "body": "Satıcı, iletişim kanalı üzerinden doğrulama talebi oluşturur ve gerekli bilgileri sunar."
  },
  {
    "title": "Kontrol alanları",
    "body": "Kimlik, iletişim, ürün sahipliği, işlem geçmişi ve topluluk sicili değerlendirilebilir."
  },
  {
    "title": "Rozet kullanımı",
    "body": "Onaylanan satıcıya doğrulama rozeti verilebilir. Rozet devredilemez ve başka hesapta kullanılamaz."
  },
  {
    "title": "Sürekli izleme",
    "body": "Şikâyet, yanlış bilgi veya kural ihlali hâlinde doğrulama askıya alınabilir ya da kaldırılabilir."
  }
];

export default function Page() {
  return (
    <LegalPage
      eyebrow="SATICI GÜVENİ"
      title="Satıcı Doğrulama Programı"
      intro="Doğrulama programı, satıcıların kimlik ve faaliyet bilgilerinin belirli kontrollerden geçtiğini gösterir; hiçbir rozet sıfır risk garantisi değildir."
      sections={sections}
    />
  );
}
