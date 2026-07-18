"use client";

export default function FloatingWhatsApp() {
  const href = `https://wa.me/905010942080?text=${encodeURIComponent("Merhaba Haswolf, destek almak istiyorum.")}`;
  return <a href={href} target="_blank" rel="noopener noreferrer" className="haswolf-floating-whatsapp" aria-label="WhatsApp destek">
    <span className="haswolf-floating-whatsapp__icon">☎</span>
    <span><strong>WhatsApp</strong><small>Canlı Destek</small></span>
  </a>;
}
