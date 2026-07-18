import LegalPage from "@/components/LegalPage";

const sections = [
  {
    "title": "Saygılı iletişim",
    "body": "Hakaret, tehdit, taciz, aşağılama, nefret söylemi ve hedef gösterme yasaktır. Fikir ayrılığı serbesttir; kişiye saldırı serbest değildir.",
    "points": [
      "Irk, din, milliyet, cinsiyet, engellilik veya kişisel özellikler üzerinden saldırı yapılamaz.",
      "Özel mesajlarda yapılan ihlaller de kanıt sunulması hâlinde moderasyon kapsamındadır.",
      "Tartışmayı büyütmek yerine raporlama kanalları kullanılmalıdır."
    ]
  },
  {
    "title": "Kişisel veriler ve mahremiyet",
    "body": "Başkasına ait telefon, adres, e-posta, ödeme bilgisi, kimlik belgesi, IP adresi veya özel yazışma izinsiz yayımlanamaz.",
    "points": [
      "Ekran görüntülerinde hassas bilgiler kapatılmalıdır.",
      "Doxxing, şantaj ve kişisel veriyle tehdit kalıcı yasak sebebidir.",
      "Çocukların veya üçüncü kişilerin verileri özellikle korunur."
    ]
  },
  {
    "title": "Ticaret güvenliği",
    "body": "Sahte ilan, olmayan ürün, yanıltıcı stok, ödeme sonrası kaybolma, kimlik taklidi ve platform dışı riskli ödeme yönlendirmesi yasaktır.",
    "points": [
      "Fiyat, sunucu, ürün niteliği ve teslimat süresi doğru belirtilmelidir.",
      "Resmî HASWOLF kanalları dışındaki ödeme taleplerine itibar edilmemelidir.",
      "Uyuşmazlıkta mesaj, ödeme ve teslimat kayıtları saklanmalıdır."
    ]
  },
  {
    "title": "Spam ve kötüye kullanım",
    "body": "Tekrarlı mesaj, reklam yağmuru, otomatik bot, zararlı bağlantı, phishing, sahte çekiliş ve kullanıcıları rahatsız eden etiketleme yasaktır.",
    "points": [
      "Aynı içeriğin farklı odalarda tekrar tekrar paylaşılması spam sayılır.",
      "Kısaltılmış ve şüpheli bağlantılar moderasyon tarafından kaldırılabilir.",
      "Sistemi yavaşlatmaya veya servisleri kötüye kullanmaya yönelik davranışlar kalıcı yasağa yol açabilir."
    ]
  },
  {
    "title": "Moderasyon ve yaptırımlar",
    "body": "İhlalin ağırlığına göre uyarı, içerik kaldırma, geçici susturma, oda yasağı, hesap yasağı veya IP özeti tabanlı bağlantı yasağı uygulanabilir.",
    "points": [
      "Kararlar olayın bağlamı, tekrar sayısı ve kullanıcı geçmişine göre verilir.",
      "Ağır dolandırıcılık, tehdit, doxxing ve güvenlik saldırılarında doğrudan kalıcı yasak uygulanabilir.",
      "IP yasağı ortak ağlarda yanlış eşleşebileceği için hesap yasağıyla birlikte değerlendirilir."
    ]
  },
  {
    "title": "İtiraz ve raporlama",
    "body": "Yanlış işlem olduğunu düşünüyorsan Sorun Bildir sayfasından tarih, kullanıcı adı, oda ve kanıtlarla itiraz oluşturabilirsin.",
    "points": [
      "İtirazlar hakaret veya tehdit içermemelidir.",
      "Sahte kanıt sunmak ek yaptırım sebebidir.",
      "Acil güvenlik durumlarında WhatsApp destek kanalı kullanılabilir."
    ]
  }
];

export default function Page() {
  return (
    <LegalPage
      eyebrow="TOPLULUK GÜVENLİĞİ"
      title="Topluluk Kuralları ve Moderasyon İlkeleri"
      intro="HASWOLF sohbet odaları, oyuncuların güvenli biçimde iletişim kurduğu, ticaret yaptığı ve bilgi paylaştığı bir topluluktur. Aşağıdaki kurallar bütün hesaplar ve misafirler için bağlayıcıdır."
      sections={sections}
    />
  );
}
