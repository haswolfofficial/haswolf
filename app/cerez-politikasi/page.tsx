import LegalPage from "@/components/LegalPage";

const sections = [
  {
    "title": "Zorunlu çerezler",
    "body": "Kimlik doğrulama oturumu, güvenlik kontrolleri ve temel site işlevleri için zorunlu çerezler kullanılır."
  },
  {
    "title": "Yerel depolama",
    "body": "Tema, PWA kurulumu, oturum ve kullanıcı tercihleri tarayıcı yerel depolamasında tutulabilir."
  },
  {
    "title": "Analitik ve performans",
    "body": "Performans ölçümü veya hata analizi araçları devreye alınırsa, mümkün olan en az veriyle ve güvenlik odaklı yapılandırılır."
  },
  {
    "title": "Kontrol seçenekleri",
    "body": "Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsin. Zorunlu çerezleri engellemek giriş, sohbet ve çekiliş özelliklerini bozabilir."
  }
];

export default function Page() {
  return (
    <LegalPage
      eyebrow="TEKNİK DEPOLAMA"
      title="Çerez ve Yerel Depolama Politikası"
      intro="HASWOLF, oturum güvenliği, tercihlerin hatırlanması ve hizmet performansı için gerekli teknik depolama mekanizmalarını kullanabilir."
      sections={sections}
    />
  );
}
