"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGuard from "../../../components/AdminGuard";
import { supabase } from "../../../lib/supabase";

type NotificationRow = {
  id: string | number;
  title: string | null;
  notification_type: string | null;
  product_id: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

export default function Page() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | number | null>(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("site_notifications")
      .select("id,title,notification_type,product_id,is_active,created_at")
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
      .update({ is_active: next })
      .eq("id", row.id);

    if (updateError) setMessage(updateError.message);
    else {
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, is_active: next } : item)));
      setMessage(next ? "Bildirim yeniden yayınlandı." : "Bildirim yayından kaldırıldı.");
    }
    setBusyId(null);
  }

  return (
    <AdminGuard title="Bildirim Yönetimi" subtitle="İndirim, stok, ürün ve özel duyuruları yayınla, pasife al veya kalıcı olarak sil.">
      {message && <p className="haswolf-admin-message">{message}</p>}
      <section className="haswolf-admin-card">
        {error && <p className="haswolf-admin-error">{error}</p>}
        <div className="haswolf-admin-responsive-list haswolf-admin-action-list">
          {rows.map((row) => (
            <article key={String(row.id)}>
              <div>
                <span>Bildirim</span>
                <b>{row.title || "İsimsiz bildirim"}</b>
                <small>{row.notification_type || "genel"}</small>
              </div>
              <div>
                <span>Durum</span>
                <b>{row.is_active ? "Yayında" : "Pasif"}</b>
                <small>{row.created_at ? new Date(row.created_at).toLocaleString("tr-TR") : "Tarih yok"}</small>
              </div>
              <div>
                <span>Ürün</span>
                <b>{row.product_id ? `#${row.product_id}` : "Bağımsız"}</b>
                <small>ID: {String(row.id)}</small>
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
