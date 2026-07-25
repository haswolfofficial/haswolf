"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const sections = [
  ["orders", "📦", "Siparişlerim"],
  ["favorites", "♥", "Favorilerim"],
  ["alerts", "🔔", "Fiyat alarmlarım"],
  ["messages", "💬", "Mesajlarım"],
  ["support", "🛠", "Destek taleplerim"],
  ["reviews", "⭐", "Yorumlarım"],
  ["notifications", "🔔", "Bildirim tercihlerim"],
  ["security", "🔒", "Güvenlik ayarlarım"],
  ["sessions", "📱", "Oturum açan cihazlar"],
] as const;

type SectionId = (typeof sections)[number][0];

type FavoriteProduct = {
  id: number;
  name: string;
  price: number;
  server: string;
  category: string;
  image_url: string | null;
  stock: number;
};

const FAVORITE_KEYS = [
  "haswolf_favorites_v1",
  "haswolf_favorites",
  "favorites",
  "favoriteProducts",
];

function readLocalFavoriteIds(): number[] {
  const ids = new Set<number>();
  for (const key of FAVORITE_KEYS) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(value)) {
        for (const item of value) {
          const id = Number(typeof item === "object" ? item?.id ?? item?.product_id : item);
          if (Number.isFinite(id) && id > 0) ids.add(id);
        }
      }
    } catch {}
  }
  return [...ids];
}

function writeLocalFavoriteIds(ids: number[]) {
  localStorage.setItem("haswolf_favorites_v1", JSON.stringify(ids));
  window.dispatchEvent(new Event("haswolf:favorites"));
}

export default function AccountPage() {
  const router = useRouter();
  const [active, setActive] = useState<SectionId>("orders");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login");
      else setUser(data.user);
      setLoading(false);
    });
  }, [router]);

  if (loading) return <main className="haswolf-account-loading">Panel hazırlanıyor…</main>;

  return (
    <main className="haswolf-account-page">
      <div className="haswolf-account-shell">
        <aside>
          <a href="/" className="haswolf-account-brand">
            HASWOLF<small>KULLANICI PANELİ</small>
          </a>

          <div className="haswolf-account-user">
            <span>{user?.email?.[0]?.toUpperCase() || "H"}</span>
            <div>
              <strong>{user?.user_metadata?.full_name || "HASWOLF Üyesi"}</strong>
              <small>{user?.email}</small>
            </div>
          </div>

          <nav>
            {sections.map(([id, icon, label]) => (
              <button
                type="button"
                className={active === id ? "is-active" : ""}
                key={id}
                onClick={() => setActive(id)}
              >
                <span>{icon}</span>{label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="haswolf-account-logout"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/");
            }}
          >
            Çıkış yap
          </button>
        </aside>

        <section>
          <header>
            <div>
              <small>HESABIM</small>
              <h1>{sections.find((item) => item[0] === active)?.[2]}</h1>
            </div>
            <a href="/">Siteye dön</a>
          </header>

          <Panel active={active} user={user} />
        </section>
      </div>
    </main>
  );
}

function Panel({ active, user }: { active: SectionId; user: any }) {
  if (active === "favorites") return <FavoritesPanel userId={user?.id || ""} />;
  if (active === "notifications") return <NotificationPreferences />;
  if (active === "security") return <SecurityPanel email={user?.email || ""} />;
  if (active === "sessions") return <SessionsPanel />;
  if (active === "alerts") return <SimpleDataPanel table="price_alerts" title="Fiyat alarmlarım" userId={user?.id || ""} />;
  if (active === "orders") return <SimpleDataPanel table="orders" title="Siparişlerim" userId={user?.id || ""} />;
  if (active === "messages") return <SimpleDataPanel table="messages" title="Mesajlarım" userId={user?.id || ""} />;
  if (active === "support") return <SimpleDataPanel table="support_tickets" title="Destek taleplerim" userId={user?.id || ""} />;
  return <SimpleDataPanel table="reviews" title="Yorumlarım" userId={user?.id || ""} />;
}

function SimpleDataPanel({ table, title, userId }: { table: string; title: string; userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const result = await supabase
        .from(table)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!active) return;
      if (result.error) {
        setRows([]);
        setMessage("Henüz burada gösterilecek bir kayıt yok.");
      } else {
        setRows(result.data || []);
        setMessage("");
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [table, userId]);

  if (loading) return <div className="haswolf-panel-empty"><span>◆</span><h2>Yükleniyor…</h2></div>;

  if (!rows.length) {
    return (
      <div className="haswolf-panel-empty">
        <span>◆</span>
        <h2>{title}</h2>
        <p>{message || "Henüz burada gösterilecek bir kayıt yok."}</p>
        <a href="/#market">Markete git</a>
      </div>
    );
  }

  return (
    <div className="haswolf-panel-card">
      <h2>{title}</h2>
      <div className="haswolf-account-records">
        {rows.map((row, index) => (
          <article key={row.id ?? index}>
            <strong>{row.title || row.subject || row.product_name || row.status || `Kayıt ${index + 1}`}</strong>
            <span>{row.description || row.message || row.content || row.status || "Detay bilgisi"}</span>
            {row.created_at && <small>{new Date(row.created_at).toLocaleString("tr-TR")}</small>}
          </article>
        ))}
      </div>
    </div>
  );
}

function NotificationPreferences() {
  const items = ["Siparişler", "Fiyat alarmları", "Mesajlar", "Kampanyalar", "Favoriler", "Admin duyuruları"];
  const [settings, setSettings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setSettings(JSON.parse(localStorage.getItem("haswolf_notification_preferences") || "{}"));
    } catch {
      setSettings({});
    }
  }, []);

  function toggle(item: string) {
    const next = { ...settings, [item]: settings[item] === false };
    setSettings(next);
    localStorage.setItem("haswolf_notification_preferences", JSON.stringify(next));
  }

  return (
    <div className="haswolf-panel-card">
      <h2>Bildirim tercihleri</h2>
      {items.map((item) => (
        <label key={item}>
          <span>{item}</span>
          <input type="checkbox" checked={settings[item] !== false} onChange={() => toggle(item)} />
        </label>
      ))}
      <p className="haswolf-panel-note">Tercihler bu cihazda anında kaydedilir.</p>
    </div>
  );
}

function SecurityPanel({ email }: { email: string }) {
  const [status, setStatus] = useState("");

  async function resetPassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setStatus(error ? error.message : "Şifre yenileme bağlantısı e-posta adresine gönderildi.");
  }

  return (
    <div className="haswolf-panel-card">
      <h2>Güvenlik ayarları</h2>
      <button type="button" onClick={() => void resetPassword()}>Şifremi güncelle</button>
      <button type="button" onClick={() => setStatus("İki adımlı doğrulama ayarı yakında hesap paneline eklenecek.")}>
        İki adımlı doğrulamayı yapılandır
      </button>
      <button type="button" onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }}>
        Bu cihazdaki oturumu kapat
      </button>
      {status && <p className="haswolf-panel-note">{status}</p>}
    </div>
  );
}

function SessionsPanel() {
  const device = useMemo(() => {
    if (typeof navigator === "undefined") return "Bu cihaz";
    const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    return `${mobile ? "Mobil cihaz" : "Bilgisayar"} · ${navigator.platform || "Tarayıcı"}`;
  }, []);

  return (
    <div className="haswolf-panel-card">
      <h2>Oturum açan cihazlar</h2>
      <article>
        <b>Bu cihaz</b>
        <span>{device}</span>
        <em>Şimdi aktif</em>
      </article>
    </div>
  );
}

function FavoritesPanel({ userId }: { userId: string }) {
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFavorites() {
    setLoading(true);
    setError("");

    try {
      const localIds = readLocalFavoriteIds();
      let databaseIds: number[] = [];

      const favoritesResult = await supabase
        .from("product_favorites")
        .select("product_id")
        .eq("user_id", userId);

      if (!favoritesResult.error) {
        databaseIds = (favoritesResult.data || [])
          .map((row: any) => Number(row.product_id))
          .filter(Boolean);
      }

      const ids = [...new Set([...databaseIds, ...localIds])];
      if (!ids.length) {
        setProducts([]);
        return;
      }

      const productsResult = await supabase
        .from("products")
        .select("id,name,price,server,category,image_url,stock")
        .in("id", ids);

      if (productsResult.error) throw productsResult.error;
      setProducts((productsResult.data || []) as FavoriteProduct[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Favoriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFavorites();
    const refresh = () => void loadFavorites();
    window.addEventListener("haswolf:favorites", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("haswolf:favorites", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [userId]);

  async function removeFavorite(productId: number) {
    await supabase.from("product_favorites").delete().eq("user_id", userId).eq("product_id", productId);
    const ids = readLocalFavoriteIds().filter((id) => id !== productId);
    writeLocalFavoriteIds(ids);
    setProducts((current) => current.filter((product) => product.id !== productId));
  }

  if (loading) return <div className="haswolf-panel-empty"><span>◆</span><h2>Favoriler yükleniyor…</h2></div>;

  if (error) {
    return (
      <div className="haswolf-panel-empty">
        <span>!</span>
        <h2>Favoriler yüklenemedi</h2>
        <p>{error}</p>
        <button type="button" onClick={() => void loadFavorites()}>Tekrar dene</button>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="haswolf-panel-empty">
        <span>◆</span>
        <h2>Henüz favori ürünün yok</h2>
        <p>Kalp simgesiyle favoriye eklediğin ürünler burada görüntülenir.</p>
        <a href="/#market">Markete git</a>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <article key={product.id} className="rounded-2xl border border-[#d9aa4a]/30 bg-[#0c0f0f] p-4">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-40 w-full rounded-xl object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl bg-black text-4xl">◆</div>
          )}
          <h2 className="mt-4 text-lg font-black text-white">{product.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">{product.server} · {product.category}</p>
          <strong className="mt-3 block text-xl text-[#d9aa4a]">
            {Number(product.price).toLocaleString("tr-TR")} TL
          </strong>
          <div className="mt-4 flex gap-2">
            <a href={`/?product=${product.id}#market`} className="flex-1 rounded-lg bg-[#d9aa4a] px-3 py-2 text-center font-bold text-black">
              Ürüne git
            </a>
            <button type="button" onClick={() => void removeFavorite(product.id)} className="rounded-lg border border-red-500/40 px-3 py-2 text-red-300">
              Kaldır
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}