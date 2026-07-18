"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminGuard from "../../../components/AdminGuard";
import { supabase } from "../../../lib/supabase";

type Guild = { id: string; name: string; badge: string; color: string; owner_id: string | null; is_active: boolean; created_at: string };
type Profile = { id: string; nickname: string | null };
type GuildMember = { id: string; guild_id: string; user_id: string; role: string; joined_at: string };
type GuildInvite = { id: string; guild_id: string; invited_user_id: string; status: string; created_at: string; expires_at?: string | null };

export default function Page() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [invites, setInvites] = useState<GuildInvite[]>([]);
  const [name, setName] = useState("");
  const [badge, setBadge] = useState("🛡");
  const [color, setColor] = useState("#d9aa4a");
  const [inviteGuild, setInviteGuild] = useState("");
  const [inviteUser, setInviteUser] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const [g, p, m, i] = await Promise.all([
      supabase.from("guilds").select("id,name,badge,color,owner_id,is_active,created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,nickname").order("nickname").limit(300),
      supabase.from("guild_members").select("id,guild_id,user_id,role,joined_at").order("joined_at", { ascending: false }),
      supabase.from("guild_invites").select("id,guild_id,invited_user_id,status,created_at,expires_at").order("created_at", { ascending: false }),
    ]);
    if (g.error) setMsg(g.error.message); else setGuilds((g.data || []) as Guild[]);
    if (!p.error) setProfiles((p.data || []) as Profile[]);
    if (!m.error) setMembers((m.data || []) as GuildMember[]);
    if (!i.error) setInvites((i.data || []) as GuildInvite[]);
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => { if (!inviteGuild && guilds[0]) setInviteGuild(guilds[0].id); }, [guilds, inviteGuild]);

  const guildMap = useMemo(() => new Map(guilds.map((guild) => [guild.id, guild])), [guilds]);
  const profileMap = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("guilds").insert({ name: name.trim(), badge, color });
    setMsg(error?.message || "Lonca oluşturuldu.");
    if (!error) { setName(""); await load(); }
  }

  async function sendInvite(e: FormEvent) {
    e.preventDefault();
    if (!inviteGuild || !inviteUser) return;
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("guild_invites").insert({
      guild_id: inviteGuild,
      invited_user_id: inviteUser,
      inviter_id: auth.user?.id || null,
      invited_by: auth.user?.id || null,
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    setMsg(error?.message || "Lonca daveti gönderildi.");
    if (!error) { setInviteUser(""); await load(); }
  }

  async function toggle(guild: Guild) {
    const { error } = await supabase.from("guilds").update({ is_active: !guild.is_active }).eq("id", guild.id);
    setMsg(error?.message || "Lonca durumu güncellendi.");
    await load();
  }

  async function removeGuild(guild: Guild) {
    if (!confirm(`${guild.name} loncası silinsin mi?`)) return;
    const { error } = await supabase.from("guilds").delete().eq("id", guild.id);
    setMsg(error?.message || "Lonca silindi.");
    await load();
  }

  async function updateMember(member: GuildMember, patch: Partial<GuildMember>) {
    const { error } = await supabase.from("guild_members").update(patch).eq("id", member.id);
    setMsg(error?.message || "Üye rolü güncellendi.");
    await load();
  }

  async function removeMember(member: GuildMember) {
    const { error } = await supabase.from("guild_members").delete().eq("id", member.id);
    setMsg(error?.message || "Üye loncadan çıkarıldı.");
    await load();
  }

  async function cancelInvite(invite: GuildInvite) {
    const { error } = await supabase.from("guild_invites").update({ status: "cancelled", responded_at: new Date().toISOString() }).eq("id", invite.id);
    setMsg(error?.message || "Davet iptal edildi.");
    await load();
  }

  return (
    <AdminGuard title="Lonca Yönetimi" subtitle="Lonca, üye, davet, rol, rozet ve özel oda yönetimi tek merkezde.">
      <div className="haswolf-admin-two-column haswolf-guild-admin-top">
        <form onSubmit={create} className="haswolf-admin-campaign-form">
          <header className="haswolf-admin-section-title"><div><small>YENİ LONCA</small><h2>Lonca Oluştur</h2></div></header>
          <div className="haswolf-admin-form-grid">
            <label><span>Lonca adı</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. ETERNAL" /></label>
            <label><span>Rozet</span><input value={badge} onChange={(e) => setBadge(e.target.value)} maxLength={8} /></label>
            <label><span>Renk</span><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
            <button>＋ Lonca Oluştur</button>
          </div>
        </form>

        <form onSubmit={sendInvite} className="haswolf-admin-campaign-form">
          <header className="haswolf-admin-section-title"><div><small>ÜYE DAVETİ</small><h2>Lonca Daveti Gönder</h2></div></header>
          <div className="haswolf-admin-form-grid haswolf-guild-invite-grid">
            <label><span>Lonca</span><select value={inviteGuild} onChange={(e) => setInviteGuild(e.target.value)}>{guilds.map((guild) => <option key={guild.id} value={guild.id}>{guild.name}</option>)}</select></label>
            <label><span>Kullanıcı mahlası</span><select value={inviteUser} onChange={(e) => setInviteUser(e.target.value)}><option value="">Kullanıcı seç</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.nickname || profile.id.slice(0, 8)}</option>)}</select></label>
            <button disabled={!guilds.length}>✉ Davet Gönder</button>
          </div>
        </form>
      </div>

      {msg && <p className="haswolf-admin-message">{msg}</p>}

      <section className="haswolf-admin-card">
        <header className="haswolf-admin-section-title"><div><small>LONCALAR</small><h2>Aktif Lonca Kartları</h2></div><b>{guilds.length}</b></header>
        <div className="haswolf-admin-responsive-list haswolf-admin-action-list">
          {guilds.map((guild) => <article key={guild.id}>
            <div className="haswolf-guild-preview" style={{ borderColor: guild.color }}><strong>{guild.badge}</strong><span><b>{guild.name}</b><small>{guild.is_active ? "Aktif lonca" : "Kapalı"}</small></span></div>
            <div><span>Lider</span><b>{profileMap.get(guild.owner_id || "")?.nickname || guild.owner_id || "Henüz atanmadı"}</b></div>
            <div><span>Üye</span><b>{members.filter((member) => member.guild_id === guild.id).length}</b></div>
            <div className="haswolf-admin-actions"><button onClick={() => toggle(guild)}>{guild.is_active ? "Kapat" : "Aktifleştir"}</button><a href={`/admin/sohbet?guild=${guild.id}`}>Özel Odalar</a><button className="is-danger" onClick={() => removeGuild(guild)}>Sil</button></div>
          </article>)}
          {!guilds.length && <p className="haswolf-admin-empty">İlk loncayı yukarıdaki formdan oluştur.</p>}
        </div>
      </section>

      <div className="haswolf-admin-two-column">
        <section className="haswolf-admin-card">
          <header className="haswolf-admin-section-title"><div><small>ÜYELER</small><h2>Lonca Üyeleri ve Roller</h2></div><b>{members.length}</b></header>
          <div className="haswolf-admin-room-list haswolf-guild-member-list">
            {members.map((member) => <article key={member.id}>
              <div><strong>{profileMap.get(member.user_id)?.nickname || member.user_id.slice(0, 8)}</strong><small>{guildMap.get(member.guild_id)?.name || "Bilinmeyen lonca"}</small></div>
              <label><span>Rol</span><select value={member.role} onChange={(e) => updateMember(member, { role: e.target.value })}><option value="member">Üye</option><option value="officer">Subay</option><option value="moderator">Moderatör</option><option value="leader">Lider</option></select></label>
              <button className="is-danger" onClick={() => removeMember(member)}>Çıkar</button>
            </article>)}
            {!members.length && <p className="haswolf-admin-empty">Henüz lonca üyesi bulunmuyor.</p>}
          </div>
        </section>

        <section className="haswolf-admin-card">
          <header className="haswolf-admin-section-title"><div><small>DAVETLER</small><h2>Lonca Davetleri</h2></div><b>{invites.length}</b></header>
          <div className="haswolf-admin-user-list">
            {invites.map((invite) => <article key={invite.id} className="haswolf-guild-invite-row"><div><b>{profileMap.get(invite.invited_user_id)?.nickname || invite.invited_user_id.slice(0, 8)}</b><small>{guildMap.get(invite.guild_id)?.name || "Bilinmeyen lonca"} · {invite.status}</small></div><time>{new Date(invite.created_at).toLocaleString("tr-TR")}</time>{invite.status === "pending" && <button onClick={() => cancelInvite(invite)}>İptal</button>}</article>)}
            {!invites.length && <p className="haswolf-admin-empty">Henüz gönderilmiş davet yok.</p>}
          </div>
        </section>
      </div>
    </AdminGuard>
  );
}
