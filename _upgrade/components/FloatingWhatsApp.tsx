"use client";

import { usePathname } from "next/navigation";

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const community = pathname.startsWith("/topluluk");
  const href = `https://wa.me/905010942080?text=${encodeURIComponent("Merhaba Haswolf, destek almak istiyorum.")}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`haswolf-floating-whatsapp ${community ? "haswolf-floating-whatsapp--community" : ""}`}
      aria-label="WhatsApp destek"
    >
      <span className="haswolf-floating-whatsapp__icon">☎</span>
      <span><strong>WhatsApp</strong><small>Canlı Destek</small></span>
    </a>
  );
}
