import LegalPage from "@/components/LegalPage";

const sections = [
  {
    "title": "Nasıl giriş yaparım?",
    "body": "Google ile giriş yapabilir veya Misafir Olarak Giriş seçeneğini kullanabilirsin. Misafir adları sistem tarafından otomatik verilir."
  },
  {
    "title": "Misafir adım değişir mi?",
    "body": "Misafir mahlasları Misafir 1, Misafir 2 şeklinde sırayla atanır. Misafir hesapları geçici olabilir; kalıcı profil için Google girişi önerilir."
  },
  {
    "title": "Çekilişe nasıl katılırım?",
    "body": "Çekiliş Merkezi'nde aktif kampanyayı açıp Çekilişe Katıl düğmesine bas. Her hesap aynı çekilişe bir kez katılabilir."
  },
  {
    "title": "Kazanan nasıl seçilir?",
    "body": "Kazanan seçimi tarayıcıda değil, sunucu tarafında güvenli rastgelelik ile yapılır ve arşivlenir."
  },
  {
    "title": "Yasaklandım, ne yapmalıyım?",
    "body": "Sorun Bildir sayfasından kullanıcı adı, tarih ve kanıtlarla itiraz oluşturabilirsin."
  },
  {
    "title": "Uygulamayı nasıl kurarım?",
    "body": "Ana sayfadaki Uygulama İndir düğmesini kullan. Destekleyen tarayıcı kurulum penceresi gösterir."
  }
];

export default function Page() {
  return (
    <LegalPage
      eyebrow="DESTEK MERKEZİ"
      title="Sık Sorulan Sorular"
      intro="Giriş, misafir hesapları, çekilişler, market ve güvenlik hakkında en sık sorulan sorular."
      sections={sections}
    />
  );
}
