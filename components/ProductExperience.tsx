"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ProductLite = {
  id: number;
  name: string;
  price: number;
  old_price?: number | null;
  server: string;
  category: "item" | "yang" | "dc" | "account";
  stock: number;
  delivery_time?: string | null;
  view_count?: number | null;
  image_url?: string | null;
  favorite_count?: number | null;
  is_daily_favorite?: boolean | null;
  is_best_price?: boolean | null;
  low_stock_alert?: boolean | null;
};

const FAVORITES_KEY = "haswolf_favorites_v1";
const COMPARE_KEY = "haswolf_compare_v1";

function getGuestKey() {
  let key = localStorage.getItem("haswolf_guest_key");

  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("haswolf_guest_key", key);
  }

  return key;
}

export default function ProductExperience({
  product,
  compact = false,
}: {
  product: ProductLite;
  compact?: boolean;
}) {
  const [favorite, setFavorite] = useState(false);
  const [compared, setCompared] = useState(false);
  const [views, setViews] = useState(product.view_count ?? 0);
  const [confirming, setConfirming] = useState(false);
  const [favoriteCount,setFavoriteCount]=useState(product.favorite_count ?? 0);

  useEffect(() => {
    const favorites = JSON.parse(
      localStorage.getItem(FAVORITES_KEY) || "[]",
    ) as number[];

    const comparedProducts = JSON.parse(
      localStorage.getItem(COMPARE_KEY) || "[]",
    ) as ProductLite[];

    setFavorite(favorites.includes(product.id));
    setCompared(comparedProducts.some((item) => item.id === product.id));

    const viewedKey = `haswolf_viewed_${product.id}`;

    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, "1");
      setViews((current) => current + 1);

      void supabase.rpc("increment_product_view", {
        product_id_input: product.id,
      });
    }
  }, [product.id]);

  async function toggleFavorite() {
    const current = JSON.parse(
      localStorage.getItem(FAVORITES_KEY) || "[]",
    ) as number[];

    const isAlreadyFavorite = current.includes(product.id);
    const next = isAlreadyFavorite
      ? current.filter((id) => id !== product.id)
      : [...current, product.id];

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setFavorite(!isAlreadyFavorite);
    setFavoriteCount((count)=>Math.max(0,count+(isAlreadyFavorite?-1:1)));
    window.dispatchEvent(new Event("haswolf:favorites"));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isAlreadyFavorite) {
      await supabase.from("product_favorites").upsert({
        user_id: user?.id ?? null,
        guest_key: user ? null : getGuestKey(),
        product_id: product.id,
      });

      return;
    }

    if (user) {
      await supabase
        .from("product_favorites")
        .delete()
        .eq("product_id", product.id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("product_favorites")
        .delete()
        .eq("product_id", product.id)
        .eq("guest_key", getGuestKey());
    }
  }

  function toggleCompare() {
    const current = JSON.parse(
      localStorage.getItem(COMPARE_KEY) || "[]",
    ) as ProductLite[];

    const exists = current.some((item) => item.id === product.id);

    const next = exists
      ? current.filter((item) => item.id !== product.id)
      : [...current, product].slice(-3);

    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    setCompared(!exists);
    window.dispatchEvent(new Event("haswolf:compare"));
  }

  async function shareProduct() {
    const url = `${location.origin}/?product=${product.id}#market`;
    const unit = product.category === "dc" ? "M" : "TL";
    const text = `${product.name} - ${product.price.toLocaleString("tr-TR")} ${unit}`;

    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text,
        url,
      });

      return;
    }

    await navigator.clipboard.writeText(url);
    window.alert("Ürün bağlantısı kopyalandı.");
  }

  function buyProduct() {
    setConfirming(true);

    window.setTimeout(() => {
      const message = encodeURIComponent(
        `Merhaba Haswolf, ${product.server} sunucusundaki ${product.name} ürününü satın almak istiyorum.`,
      );

      window.open(
        `https://wa.me/905010942080?text=${message}`,
        "_blank",
        "noopener,noreferrer",
      );

      setConfirming(false);
    }, 450);
  }

  const stockLabel =
    product.stock <= 2 || product.low_stock_alert ? `Stok azalıyor · ${product.stock}` : `Stok ${product.stock}`;

  return (
    <div
      className={
        compact ? "haswolf-product-xp is-compact" : "haswolf-product-xp"
      }
    >
      {(product.is_daily_favorite || product.is_best_price) && <div className="haswolf-product-badges">{product.is_daily_favorite&&<b>⭐ BUGÜNÜN FAVORİSİ</b>}{product.is_best_price&&<b>🏆 EN UYGUN FİYAT</b>}</div>}
      <div className="haswolf-product-xp__meta">
        <span>Görüntülenme: {views.toLocaleString("tr-TR")}</span>
        <span>Favorileyen: {favoriteCount.toLocaleString("tr-TR")}</span>
        <span>Teslimat: {product.delivery_time || "1 saat"}</span>
        <span className={product.stock <= 2 || product.low_stock_alert ? "is-low-stock" : ""}>
          {stockLabel}
        </span>
      </div>

      <div className="haswolf-product-xp__actions">
        <button
          type="button"
          className={favorite ? "is-active" : ""}
          onClick={toggleFavorite}
        >
          {favorite ? "Favoride" : "Favoriye Ekle"}
        </button>

        <button
          type="button"
          className={compared ? "is-active" : ""}
          onClick={toggleCompare}
        >
          Karşılaştır
        </button>

        <button type="button" onClick={shareProduct}>
          Paylaş
        </button>
      </div>
    </div>
  );
}
