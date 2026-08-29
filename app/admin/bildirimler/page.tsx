"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminGuard from "../../../components/AdminGuard";
import { supabase } from "../../../lib/supabase";

const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/K4Porjlqi5GLlsowoTG4WQ";

type NotificationRow = {
  id: string | number;
  title: string | null;
  body?: string | null;
  link?: string | null;
  image_url?: string | null;
  notification_type: string | null;
  product_id: number | null;
  is_active: boolean | null;
  is_pinned?: boolean | null;
  created_at: string | null;
};

export default function Page() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pinned, setPinned] = useState(false);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("site_notifications")
      .select("id,title,body,link,image_url,notification_type,product_id,is_active,is_pinned,created_at")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setError("");
    setRows((data || []) as NotificationRow[]);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("admin-bildirimler-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_notifications" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  function buildWhatsAppText(currentTitle: string, currentBody: string, currentLink: string) {
    const parts = [
      "📣 *HASWOLF DUYURU*",
      "",
      `*${currentTitle}*`,
      currentBody,
    ];
    if (currentLink) parts.push("", `🔗 ${currentLink}`);
    parts.push("", "🐺 HASWOLF MARKET", "https://www.haswolf.com");
    return parts.join("\n");
  }

  async function saveAnnouncement(shareToWhatsApp: boolean) {
    const currentTitle = title.trim();
    const currentBody = body.trim();
    const currentLink = link.trim();

    if (!currentTitle || !currentBody) {
      setMessage("Duyuru başlığı ve açıklaması zorunlu.");
      return;
    }

    // Async kayıt sonrası popup engeline takılmamak için kullanıcı tıklaması sırasında sekmeyi hazırla.
    const shareWindow = shareToWhatsApp ? window.open("about:blank", "_blank") : null;

    setPublishing(true);
    setMessage("");
    const { data: session } = await supabase.auth.getSession();
    const { error: insertError } = await supabase.from("site_notifications").insert({
      title: currentTitle,
      body: currentBody,
      link: currentLink || null,
      image_url: imageUrl.trim() || null,
      notification_type: "announcement",
      is_active: true,
      is_pinned: pinned,
      created_by: session.session?.user.id || null,
    });

    if (insertError) {
      shareWindow?.close();
      setMessage(insertError.message);
      setPublishing(false);
      return;
    }

    setTitle("");
    setBody("");
    setLink("");
    setImageUrl("");
    setPinned(false);
    await load();

    if (shareToWhatsApp) {
      const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(buildWhatsAppText(currentTitle, currentBody, currentLink))}`;
      if (shareWindow) shareWindow.location.href = whatsappShareUrl;
      else window.open(whatsappShareUrl, "_blank", "noopener,noreferrer");
      setMessage("Duyuru HASWOLF sitesinde yayınlandı. WhatsApp paylaşım ekranı açıldı; topluluğun Duyurular sohbetini seçip Gönder'e bas.");
    } else {
      setMessage("Duyuru yayınlandı. Ana sayfadaki bildirim sayacı anında güncellenecek.");
    }

    setPublishing(false);
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    await saveAnnouncement(false);
  }

  async function remove(row: NotificationRow) {
    const confirmed = window.confirm(`“${row.title || "İsimsiz bildirim"}” kalıcı olarak silinsin mi?`);
    if (!confirmed) return;

    setBusyId(row.id);
    setMessage("");
    const { error: deleteError } = await supabase.from("site_notifications").delete().eq("id", row.id);

    if (deleteError) {
      setMessage(deleteError.message);
    } else {
      setRows((current) => current.filter((item) => item.id !== row.id));
      setMessage("Bildirim kalıcı olarak silindi.");
      await supabase.from("audit_logs").insert({
        action: "notification_deleted",
        entity_type: "site_notification",
        entity_id: String(row.id),
        summary: `${row.title || "İsimsiz bildirim"} silindi`,
      });
    }
    setBusyId(null);
  }

  async function toggle(row: NotificationRow) {
    setBusyId(row.id);
    setMessage("");
    const next = !row.is_active;
    const { error: updateError } = await supabase
      .from("site_notifications")
      .update({ is_active: next, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (updateError) setMessage(updateError.message);
    else {
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, is_active: next } : item)));
      setMessage(next ? "Bildirim yeniden yayınlandı." : "Bildirim yayından kaldırıldı.");
    }
    setBusyId(null);
  }

  return (
    <AdminGuard title="Bildirim Yönetimi" subtitle="Duyuruyu tek merkezden hazırla; HASWOLF'ta yayınla ve aynı metni WhatsApp topluluğuna gönder.">
      {message && <p className="haswolf-admin-message">{message}</p>}

      <section className="haswolf-admin-card" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <small style={{ color: "#d9aa4a", fontWeight: 800, letterSpacing: ".12em" }}>TEK MERKEZ DUYURU</small>
          <h2 style={{ marginTop: 6, fontSize: 22 }}>Duyuru Yayınla</h2>
          <p style={{ color: "#8d9498", marginTop: 6 }}>Bir kez yaz. HASWOLF sitesinde yayınla; istersen aynı hazır metni WhatsApp topluluğunun Duyurular sohbetine gönder.</p>
        </div>
        <form onSubmit={publish} style={{ display: "grid", gap: 12 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Duyuru başlığı" maxLength={120} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Duyuru açıklaması" rows={5} maxLength={1200} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Bağlantı (isteğe bağlı)" />
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Görsel URL (isteğe bağlı)" />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#c9c9c9" }}>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Duyuruyu sabitle
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
            <button type="submit" disabled={publishing} style={{ minHeight: 50, background: "linear-gradient(135deg,#b77b17,#e3b653)", color: "#080706", fontWeight: 900, borderRadius: 10 }}>
              {publishing ? "Yayınlanıyor..." : "📣 Sitede Yayınla"}
            </button>
            <button type="button" disabled={publishing} onClick={() => void saveAnnouncement(true)} style={{ minHeight: 50, background: "linear-gradient(135deg,#087a3d,#19c968)", color: "white", fontWeight: 900, borderRadius: 10, border: "1px solid rgba(65,255,154,.35)" }}>
              {publishing ? "Hazırlanıyor..." : "🟢 Yayınla + WhatsApp'a Gönder"}
            </button>
          </div>

          <div style={{ border: "1px solid rgba(37,211,102,.24)", background: "rgba(37,211,102,.06)", padding: 12, borderRadius: 10, color: "#a9b5af", fontSize: 13, lineHeight: 1.55 }}>
            <b style={{ color: "#5ee995" }}>WhatsApp Topluluğu bağlı:</b> HASWOLF topluluk daveti hazır. WhatsApp, topluluk duyuru sohbetine web sitesinin otomatik mesaj atmasına izin vermediği için paylaşım ekranında yalnızca <b>Duyurular</b> sohbetini seçip <b>Gönder</b> demen yeterli.
            <div style={{ marginTop: 7 }}><a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noreferrer" style={{ color: "#5ee995", fontWeight: 800 }}>Topluluğu WhatsApp'ta Aç ↗</a></div>
          </div>
        </form>
      </section>

      <section className="haswolf-admin-card">
        {error && <p className="haswolf-admin-error">{error}</p>}
        <div className="haswolf-admin-responsive-list haswolf-admin-action-list">
          {rows.map((row) => (
            <article key={String(row.id)}>
              <div>
                <span>{row.is_pinned ? "📌 Sabit Duyuru" : "Bildirim"}</span>
                <b>{row.title || "İsimsiz bildirim"}</b>
                <small>{row.body || row.notification_type || "genel"}</small>
              </div>
              <div>
                <span>Durum</span>
                <b>{row.is_active ? "Yayında" : "Pasif"}</b>
                <small>{row.created_at ? new Date(row.created_at).toLocaleString("tr-TR") : "Tarih yok"}</small>
              </div>
              <div>
                <span>Bağlantı</span>
                <b>{row.link ? "Var" : "Yok"}</b>
                <small>{row.notification_type || "genel"}</small>
              </div>
              <div className="haswolf-admin-actions">
                <button type="button" disabled={busyId === row.id} onClick={() => toggle(row)}>
                  {row.is_active ? "Yayından Kaldır" : "Yeniden Yayınla"}
                </button>
                <button type="button" className="is-danger" disabled={busyId === row.id} onClick={() => remove(row)}>
                  🗑 Sil
                </button>
              </div>
            </article>
          ))}
          {!rows.length && !error && <p className="haswolf-admin-empty">Henüz kayıt bulunmuyor.</p>}
        </div>
      </section>
    </AdminGuard>
  );
}
