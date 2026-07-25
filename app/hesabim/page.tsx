"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const sections = [
  ["orders", "ğŸ“¦", "SipariÅŸlerim"],
  ["favorites", "â™¥", "Favorilerim"],
  ["alerts", "ğŸ””", "Fiyat alarmÄ±m"],
  ["messages", "ğŸ’¬", "MesajlarÄ±m"],
  ["support", "ğŸ› ", "Destek taleplerim"],
  ["reviews", "â­", "YorumlarÄ±m"],
  ["notifications", "ğŸ””", "Bildirim tercihlerim"],
  ["security", "ğŸ”’", "GÃ¼venlik ayarlarÄ±m"],
  ["sessions", "ğŸ“±", "Oturum aÃ§an cihazlar"],
] as const;

type FavoriteProduct = {
  id: number;
  name: string;
  price: number;
  server: string;
  category: string;
  image_url: string | null;
  stock: number;
};

const FAVORITES_KEY = "haswolf_favorites_v1";

export default function AccountPage() {
  const router = useRouter();
  const [active, setActive] = useState("orders");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login");
      else setUser(data.user);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return <main className="haswolf-account-loading">Panel hazÄ±rlanÄ±yorâ€¦</main>;
  }

  return (
    <main className="haswolf-account-page">
      <div className="haswolf-account-shell">
        <aside>
          <a href="/" className="haswolf-account-brand">
            HASWOLF<small>KULLANICI PANELÄ°</small>
          </a>
          <div className="haswolf-account-user">
            <span>{user?.email?.[0]?.toUpperCase()}</span>
            <div>
              <strong>
                {user?.user_metadata?.full_name || "HASWOLF Ãœyesi"}
              </strong>
              <small>{user?.email}</small>
            </div>
          </div>
          <nav>
            {sections.map(([id, icon, label]) => (
              <button
                className={active === id ? "is-active" : ""}
                key={id}
                onClick={() => setActive(id)}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </nav>
          <button
            className="haswolf-account-logout"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/");
            }}
          >
            Ã‡Ä±kÄ±ÅŸ yap
          </button>
        </aside>

        <section>
          <header>
            <div>
              <small>HESABIM</small>
              <h1>{sections.find((item) => item[0] === active)?.[2]}</h1>
            </div>
            <a href="/">Siteye dÃ¶n</a>
          </header>
          <Panel active={active} userId={user?.id || ""} />
        </section>
      </div>
    </main>
  );
}

function Panel({ active, userId }: { active: string; userId: string }) {
  if (active === "favorites") return <FavoritesPanel userId={userId} />;

  if (active === "notifications") {
    return (
      <div className="haswolf-panel-card">
        <h2>Bildirim tercihleri</h2>
        {[
          "SipariÅŸler",
          "Fiyat alarmlarÄ±",
          "Mesajlar",
          "Kampanyalar",
          "Favoriler",
          "Admin duyurularÄ±",
        ].map((item) => (
          <label key={item}>
            <span>{item}</span>
            <input type="checkbox" defaultChecked />
          </label>
        ))}
      </div>
    );
  }

  if (active === "security") {
    return (
      <div className="haswolf-panel-card">
        <h2>GÃ¼venlik ayarlarÄ±</h2>
        <button>Åifremi gÃ¼ncelle</button>
        <button>Ä°ki adÄ±mlÄ± doÄŸrulamayÄ± yapÄ±landÄ±r</button>
        <button>DiÄŸer oturumlarÄ± kapat</button>
      </div>
    );
  }

  if (active === "sessions") {
    return (
      <div className="haswolf-panel-card">
        <h2>Oturum aÃ§an cihazlar</h2>
        <article>
          <b>Bu cihaz</b>
          <span>Chrome Â· Windows</span>
          <em>Åimdi aktif</em>
        </article>
      </div>
    );
  }

  return (
    <div className="haswolf-panel-empty">
      <span>â—†</span>
      <h2>Bu bÃ¶lÃ¼m kullanÄ±ma hazÄ±r</h2>
      <p>Yeni iÅŸlemlerin burada listelenecek.</p>
      <a href="/#market">Markete git</a>
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
      const localIds = JSON.parse(
        localStorage.getItem(FAVORITES_KEY) || "[]",
      ) as number[];

      const { data: rows, error: favoriteError } = await supabase
        .from("product_favorites")
        .select("product_id")
        .eq("user_id", userId);

      if (favoriteError) throw favoriteError;

      const databaseIds = (rows || []).map((row: any) =>
        Number(row.product_id),
      );
      const ids = [...new Set([...databaseIds, ...localIds])].filter(Boolean);

      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data, error: productsError } = await supabase
        .from("products")
        .select("id,name,price,server,category,image_url,stock")
        .in("id", ids)
        .eq("is_active", true);

      if (productsError) throw productsError;
      setProducts((data || []) as FavoriteProduct[]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Favoriler yÃ¼klenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFavorites();
    const refresh = () => void loadFavorites();
    window.addEventListener("haswolf:favorites", refresh);
    return () => window.removeEventListener("haswolf:favorites", refresh);
  }, [userId]);

  async function removeFavorite(productId: number) {
    await supabase
      .from("product_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    const localIds = JSON.parse(
      localStorage.getItem(FAVORITES_KEY) || "[]",
    ) as number[];
    localStorage.setItem(
      FAVORITES_KEY,
      JSON.stringify(localIds.filter((id) => id !== productId)),
    );

    setProducts((current) =>
      current.filter((product) => product.id !== productId),
    );
    window.dispatchEvent(new Event("haswolf:favorites"));
  }

  if (loading) {
    return (
      <div className="haswolf-panel-empty">
        <span>â—†</span>
        <h2>Favoriler yÃ¼kleniyor...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="haswolf-panel-empty">
        <span>!</span>
        <h2>Favoriler yÃ¼klenemedi</h2>
        <p>{error}</p>
        <button onClick={() => void loadFavorites()}>Tekrar dene</button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="haswolf-panel-empty">
        <span>â—†</span>
        <h2>HenÃ¼z favori Ã¼rÃ¼nÃ¼n yok</h2>
        <p>Favoriye eklediÄŸin Ã¼rÃ¼nler burada gÃ¶rÃ¼ntÃ¼lenir.</p>
        <a href="/#market">Markete git</a>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <article
          key={product.id}
          className="rounded-2xl border border-[#d9aa4a]/30 bg-[#0c0f0f] p-4"
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-40 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl bg-black text-4xl">
              â—†
            </div>
          )}
          <h2 className="mt-4 text-lg font-black text-white">
            {product.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {product.server} Â· {product.category}
          </p>
          <strong className="mt-3 block text-xl text-[#d9aa4a]">
            {Number(product.price).toLocaleString("tr-TR")} TL
          </strong>
          <div className="mt-4 flex gap-2">
            <a
              href={`/?product=${product.id}#market`}
              className="flex-1 rounded-lg bg-[#d9aa4a] px-3 py-2 text-center font-bold text-black"
            >
              ÃœrÃ¼ne git
            </a>
            <button
              type="button"
              onClick={() => void removeFavorite(product.id)}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-red-300"
            >
              KaldÄ±r
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
