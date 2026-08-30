"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminGuard from "../../../components/AdminGuard";
import { supabase } from "../../../lib/supabase";

type Campaign = {
  id: number;
  title: string;
  body: string | null;
  campaign_type: string;
  target_audience: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sound_enabled: boolean;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  created_at?: string | null;
};

const emptyForm = {
  title: "",
  body: "",
  campaign_type: "ticker",
  target_audience: "all",
  starts_at: "",
  ends_at: "",
  sound_enabled: false,
  desktop_image_url: "",
  mobile_image_url: "",
  link_url: "",
};

export default function Page() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("campaigns")
      .select("id,title,body,campaign_type,target_audience,is_active,starts_at,ends_at,sound_enabled,desktop_image_url,mobile_image_url,link_url,created_at")
      .order("created_at", { ascending: false });
    if (error) setMsg(error.message);
    else setRows((data || []) as Campaign[]);
  }

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: rows.length,
      active: rows.filter((item) => item.is_active).length,
      scheduled: rows.filter((item) => item.starts_at && new Date(item.starts_at).getTime() > now).length,
      visual: rows.filter((item) => Boolean(item.desktop_image_url || item.mobile_image_url)).length,
      ticker: rows.filter((item) => item.campaign_type === "ticker").length,
    };
  }, [rows]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMsg("");
    const payload = {
      ...form,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      desktop_image_url: form.desktop_image_url.trim() || null,
      mobile_image_url: form.mobile_image_url.trim() || null,
      link_url: form.link_url.trim() || null,
      is_active: true,
    };
    const { error } = await supabase.from("campaigns").insert(payload);
    setMsg(error?.message || "Reklam başarıyla yayına alındı.");
    if (!error) {
      setForm(emptyForm);
      await load();
    }
    setSaving(false);
  }

  async function toggle(campaign: Campaign) {
    const { error } = await supabase.from("campaigns").update({ is_active: !campaign.is_active }).eq("id", campaign.id);
    if (error) setMsg(error.message);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("Bu reklam kalıcı olarak silinsin mi?")) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) setMsg(error.message);
    else setMsg("Reklam silindi.");
    await load();
  }

  return (
    <AdminGuard title="Reklam Merkezi" subtitle="Kayan yazı, banner, yan reklam, pop-up ve süreli kampanyaları tek panelden yönet.">
      <section className="haswolf-ad-admin-dashboard">
        <div><small>TOPLAM REKLAM</small><strong>{stats.total}</strong></div>
        <div><small>AKTİF</small><strong>{stats.active}</strong></div>
        <div><small>PLANLANAN</small><strong>{stats.scheduled}</strong></div>
        <div><small>GÖRSELLİ</small><strong>{stats.visual}</strong></div>
        <div><small>KAYAN YAZI</small><strong>{stats.ticker}</strong></div>
      </section>

      <form onSubmit={create} className="haswolf-admin-campaign-form haswolf-ad-admin-form">
        <div className="haswolf-ad-admin-heading">
          <div><small>YENİ YAYIN</small><h2>Reklam Oluştur</h2></div>
          <span>Kaydettiğin anda sitede görünür.</span>
        </div>

        <div className="haswolf-admin-form-grid">
          <label><span>Reklam Tipi</span><select value={form.campaign_type} onChange={(e) => setForm({ ...form, campaign_type: e.target.value })}><option value="ticker">Üst Kayan Yazı</option><option value="banner">Profesyonel Banner</option><option value="side">Yan Reklam Alanı</option><option value="popup">Pop-up Reklam</option><option value="countdown">Süreli Kampanya Kartı</option></select></label>
          <label><span>Hedef Kitle</span><select value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })}><option value="all">Herkes</option><option value="premium">Premium Üyeler</option><option value="members">Üyeler</option></select></label>
        </div>

        <div className="haswolf-admin-form-grid">
          <label><span>Başlık</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn. Haftanın Fırsatı" /></label>
          <label><span>Yönlendirme Linki</span><input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." /></label>
        </div>

        <label><span>Açıklama / Kayan Yazı Metni</span><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Reklam mesajı veya kayan yazı içeriği..." /></label>

        <div className="haswolf-admin-form-grid">
          <label><span>Masaüstü Görsel URL</span><input value={form.desktop_image_url} onChange={(e) => setForm({ ...form, desktop_image_url: e.target.value })} placeholder="https://.../reklam-desktop.jpg" /></label>
          <label><span>Mobil Görsel URL</span><input value={form.mobile_image_url} onChange={(e) => setForm({ ...form, mobile_image_url: e.target.value })} placeholder="https://.../reklam-mobile.jpg" /></label>
          <label><span>Başlangıç</span><input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
          <label><span>Bitiş</span><input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></label>
        </div>

        <label className="haswolf-admin-check"><input type="checkbox" checked={form.sound_enabled} onChange={(e) => setForm({ ...form, sound_enabled: e.target.checked })} /> Sesli bildirim kullan</label>
        <button className="haswolf-admin-primary" disabled={saving}>{saving ? "Yayınlanıyor..." : "Reklamı Yayınla"}</button>
      </form>

      {msg && <p className="haswolf-admin-message">{msg}</p>}

      <section className="haswolf-admin-card haswolf-ad-admin-list">
        <div className="haswolf-ad-admin-heading"><div><small>YAYIN KONTROLÜ</small><h2>Reklamlar</h2></div><span>{rows.length} kayıt</span></div>
        <div className="haswolf-admin-responsive-list haswolf-admin-action-list">
          {rows.map((campaign) => (
            <article key={campaign.id}>
              <div><span>{campaign.campaign_type.toUpperCase()}</span><b>{campaign.title}</b><small>{campaign.body || "Açıklama yok"}</small></div>
              <div><span>Durum</span><b className={campaign.is_active ? "is-live" : "is-off"}>{campaign.is_active ? "Yayında" : "Kapalı"}</b><small>{campaign.target_audience === "all" ? "Herkese açık" : campaign.target_audience}</small></div>
              <div><span>Görsel</span><b>{campaign.desktop_image_url || campaign.mobile_image_url ? "Var" : "Metin"}</b><small>{campaign.link_url ? "Linkli reklam" : "Linksiz"}</small></div>
              <div className="haswolf-admin-actions"><button type="button" onClick={() => toggle(campaign)}>{campaign.is_active ? "Yayından Kaldır" : "Yayınla"}</button><button type="button" className="is-danger" onClick={() => remove(campaign.id)}>Sil</button></div>
            </article>
          ))}
          {!rows.length && <p className="haswolf-ad-admin-empty">Henüz reklam eklenmedi.</p>}
        </div>
      </section>

      <style jsx global>{`
        .haswolf-ad-admin-dashboard{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:18px}.haswolf-ad-admin-dashboard>div{min-height:96px;padding:16px;border:1px solid rgba(217,170,74,.22);border-radius:14px;background:linear-gradient(145deg,rgba(217,170,74,.07),rgba(7,9,9,.9));box-shadow:inset 0 1px rgba(255,255,255,.04)}.haswolf-ad-admin-dashboard small{display:block;color:#787e7d;font-size:9px;font-weight:900;letter-spacing:.13em}.haswolf-ad-admin-dashboard strong{display:block;margin-top:10px;color:#e7bd59;font-size:28px;line-height:1}.haswolf-ad-admin-form{border:1px solid rgba(217,170,74,.28)!important;border-radius:18px!important;background:linear-gradient(145deg,rgba(12,14,14,.98),rgba(5,7,7,.98))!important;box-shadow:0 24px 70px rgba(0,0,0,.28)}.haswolf-ad-admin-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px}.haswolf-ad-admin-heading small{color:#a47c2a;font-size:9px;font-weight:900;letter-spacing:.16em}.haswolf-ad-admin-heading h2{margin:4px 0 0;color:#f0c766;font-size:20px}.haswolf-ad-admin-heading>span{color:#727978;font-size:11px}.haswolf-ad-admin-list{margin-top:18px}.haswolf-ad-admin-list article{grid-template-columns:2fr 1fr 1fr auto!important}.haswolf-ad-admin-list .is-live{color:#4ade80}.haswolf-ad-admin-list .is-off{color:#f87171}.haswolf-ad-admin-empty{padding:28px;text-align:center;color:#6f7675}.haswolf-ad-admin-form input,.haswolf-ad-admin-form textarea,.haswolf-ad-admin-form select{transition:border-color .2s ease,box-shadow .2s ease}.haswolf-ad-admin-form input:focus,.haswolf-ad-admin-form textarea:focus,.haswolf-ad-admin-form select:focus{border-color:rgba(217,170,74,.68)!important;box-shadow:0 0 0 3px rgba(217,170,74,.08)!important;outline:none}.haswolf-ad-admin-form .haswolf-admin-primary{min-height:48px;background:linear-gradient(135deg,#a9781e,#e1b64e)!important;color:#0a0b0b!important;font-weight:950!important;letter-spacing:.04em}.haswolf-ad-admin-form .haswolf-admin-primary:hover{filter:brightness(1.08);transform:translateY(-1px)}
        @media(max-width:1000px){.haswolf-ad-admin-dashboard{grid-template-columns:repeat(2,minmax(0,1fr))}.haswolf-ad-admin-list article{grid-template-columns:1fr!important}}@media(max-width:620px){.haswolf-ad-admin-dashboard{grid-template-columns:1fr 1fr}.haswolf-ad-admin-heading{align-items:flex-start;flex-direction:column}}
      `}</style>
    </AdminGuard>
  );
}
