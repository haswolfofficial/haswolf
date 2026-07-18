"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { hasAdminAccess } from "../../lib/admin-access";
import AdminSearchAnalytics from "../../components/AdminSearchAnalytics";
import AdminNav from "../../components/AdminNav";
import ProductPresetPicker, { autoPreset } from "../../components/ProductPresetPicker";

type Product = {
  id: number;
  name: string;
  category: "item" | "yang" | "dc" | "account";
  item_category: string | null;
  server: "EPHESUS" | "PERGAMON" | "TEOS";
  price: number;
  old_price: number | null;
  admin_note: string | null;
  description: string | null;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  delivery_time?: string | null;
  is_daily_favorite?: boolean | null;
  is_best_price?: boolean | null;
  low_stock_alert?: boolean | null;
};

const IMAGE_BUCKET = "product-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ITEM_CATEGORIES = [
  "Silahlar",
  "Kalkanlar",
  "Kolyeler",
  "Ayakkabılar",
  "Bilezikler",
  "Küpeler",
  "Zırhlar",
  "Kasklar",
  "Diğer",
] as const;

function getStoragePathFromPublicUrl(url: string | null) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;
  return decodeURIComponent(url.slice(markerIndex + marker.length));
}

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Product["category"]>("item");
  const [itemCategory, setItemCategory] = useState("Diğer");
  const [server, setServer] = useState<Product["server"]>("EPHESUS");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [stock, setStock] = useState("1");
  const [deliveryTime, setDeliveryTime] = useState("1 saat");
  const [presetImage,setPresetImage]=useState("");
  const [dailyFavorite,setDailyFavorite]=useState(false);
  const [bestPrice,setBestPrice]=useState(false);
  const [lowStockAlert,setLowStockAlert]=useState(false);
  const [quickYangPrices, setQuickYangPrices] = useState<Record<number, string>>({});
  const [quickDcPrices, setQuickDcPrices] = useState<Record<number, string>>({});
  const [quickSavingId, setQuickSavingId] = useState<number | null>(null);

  const yangProducts = useMemo(() => products.filter((product) => product.category === "yang"), [products]);
  const dcProducts = useMemo(() => products.filter((product) => product.category === "dc"), [products]);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      if (!(await hasAdminAccess(data.session.user))) {
        setMessage("Bu sayfaya yalnızca yetkili yönetici hesapları erişebilir.");
        setLoading(false);
        return;
      }

      setAuthorized(true);
      await loadProducts();
      setLoading(false);
    }

    init();
  }, [router]);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,category,item_category,server,price,old_price,admin_note,description,image_url,stock,is_active,delivery_time,is_daily_favorite,is_best_price,low_stock_alert")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const loadedProducts = (data ?? []) as Product[];
    setProducts(loadedProducts);
    setQuickYangPrices(Object.fromEntries(loadedProducts.filter((product) => product.category === "yang").map((product) => [product.id, String(product.price)])));
    setQuickDcPrices(Object.fromEntries(loadedProducts.filter((product) => product.category === "dc").map((product) => [product.id, String(product.price)])));
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setCategory("item");
    setItemCategory("Diğer");
    setServer("EPHESUS");
    setPrice("");
    setOldPrice("");
    setAdminNote("");
    setDescription("");
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
    setStock("1");
    setDeliveryTime("1 saat");
    setPresetImage("");
    setDailyFavorite(false);
    setBestPrice(false);
    setLowStockAlert(false);
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setItemCategory(product.item_category ?? "Diğer");
    setServer(product.server);
    setPrice(String(product.price));
    setOldPrice(product.old_price == null ? "" : String(product.old_price));
    setAdminNote(product.admin_note ?? "");
    setDescription(product.description ?? "");
    setImageUrl(product.image_url ?? "");
    setImageFile(null);
    setImagePreview(product.image_url ?? "");
    setStock(String(product.stock));
    setDeliveryTime(product.delivery_time || "1 saat");
    setPresetImage(product.image_url?.startsWith("/images/product-presets/") ? product.image_url : "");
    setDailyFavorite(Boolean(product.is_daily_favorite));
    setBestPrice(Boolean(product.is_best_price));
    setLowStockAlert(Boolean(product.low_stock_alert));
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMessage("");

    if (!file) {
      setImageFile(null);
      setImagePreview(imageUrl);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Yalnızca görsel dosyası seçebilirsin.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setMessage("Görsel en fazla 5 MB olabilir.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadSelectedImage() {
    if (!imageFile) return imageUrl.trim() || presetImage || autoPreset(category,name.trim());

    const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
    const filePath = `${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const uploadedImageUrl = await uploadSelectedImage();
      const payload = {
        name: name.trim(),
        category,
        item_category: category === "item" ? itemCategory : null,
        server,
        price: Number(price),
        old_price: oldPrice.trim() ? Number(oldPrice) : null,
        admin_note: (category === "item" || category === "account") ? adminNote.trim() || null : null,
        description: description.trim() || null,
        image_url: uploadedImageUrl,
        stock: Number(stock),
        delivery_time: deliveryTime,
        is_daily_favorite: dailyFavorite,
        is_best_price: bestPrice,
        low_stock_alert: lowStockAlert,
      };

      if (!payload.name || Number.isNaN(payload.price) || payload.price < 0) {
        throw new Error("Ürün adı ve geçerli bir fiyat gir.");
      }

      if (payload.old_price !== null && (Number.isNaN(payload.old_price) || payload.old_price <= payload.price)) {
        throw new Error("Eski fiyat, indirimli fiyattan büyük olmalı.");
      }

      if (Number.isNaN(payload.stock) || payload.stock < 0) {
        throw new Error("Geçerli bir stok değeri gir.");
      }

      if (editingId !== null) {
        const oldProduct = products.find((product) => product.id === editingId);
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;

        if (imageFile && oldProduct?.image_url) {
          const oldPath = getStoragePathFromPublicUrl(oldProduct.image_url);
          if (oldPath) await supabase.storage.from(IMAGE_BUCKET).remove([oldPath]);
        }

        setMessage("Ürün başarıyla güncellendi.");
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;

        const { error } = await supabase.from("products").insert({
          ...payload,
          is_active: true,
          created_by: userId,
        });

        if (error) throw error;
        setMessage("Ürün başarıyla eklendi.");
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşlem sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function updateQuickPrice(product: Product, marketLabel: "Yang" | "DC") {
    const source = marketLabel === "Yang" ? quickYangPrices : quickDcPrices;
    const newPrice = Number(source[product.id]);
    if (Number.isNaN(newPrice) || newPrice < 0) {
      setMessage(`Geçerli bir ${marketLabel} fiyatı gir.`);
      return;
    }

    setQuickSavingId(product.id);
    setMessage("");
    const previousProducts = products;
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, price: newPrice } : item));
    const { error } = await supabase.from("products").update({ price: newPrice }).eq("id", product.id);
    if (error) {
      setProducts(previousProducts);
      setMessage(error.message);
    } else {
      setMessage(`${product.name} fiyatı anında güncellendi${product.category === "dc" ? " (M bazlı)" : ""}.`);
    }
    setQuickSavingId(null);
  }

  async function toggleProduct(product: Product) {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadProducts();
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm("Bu ürünü silmek istediğine emin misin?");
    if (!confirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", product.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    const imagePath = getStoragePathFromPublicUrl(product.image_url);
    if (imagePath) await supabase.storage.from(IMAGE_BUCKET).remove([imagePath]);

    if (editingId === product.id) resetForm();
    await loadProducts();
  }

  if (loading) {
    return <main className="min-h-screen bg-[#050707] p-8 text-white">Kontrol ediliyor...</main>;
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#050707] p-8 text-white">
        <div className="mx-auto max-w-xl rounded-xl border border-red-500/40 bg-red-950/20 p-6">
          {message}
        </div>
      </main>
    );
  }

  return (
    <main className="haswolf-admin-v5"><AdminNav/><section className="haswolf-admin-v5__content">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black text-[#d9aa4a]"><a href="/" className="transition hover:text-white">HASWOLF</a> Admin Paneli</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Ürün, görsel, Yang ve DC fiyatlarını tek panelden yönet
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-[#8c641e] px-4 py-3 text-[#e5b64e]"
          >
            Siteye Dön
          </button>
        </div>

        <AdminSearchAnalytics />

        <section className="mb-8 rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-5">
          <div className="mb-4">
            <h2 className="text-xl font-black text-[#e3b653]">Hızlı Yang Fiyat Yönetimi</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Kaydet dediğinde ana sayfadaki fiyat Supabase Realtime üzerinden hemen yenilenir.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {yangProducts.map((product) => (
              <div key={product.id} className="rounded-lg border border-white/10 bg-black/50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{product.name}</p>
                    <p className="text-xs text-zinc-500">{product.server}</p>
                  </div>
                  <span className={product.is_active ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
                    {product.is_active ? "Yayında" : "Pasif"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quickYangPrices[product.id] ?? ""}
                    onChange={(event) =>
                      setQuickYangPrices((current) => ({
                        ...current,
                        [product.id]: event.target.value,
                      }))
                    }
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => updateQuickPrice(product, "Yang")}
                    disabled={quickSavingId === product.id}
                    className="rounded-lg bg-[#d1a13d] px-4 py-2 font-bold text-black disabled:opacity-60"
                  >
                    {quickSavingId === product.id ? "..." : "Kaydet"}
                  </button>
                </div>
              </div>
            ))}
            {yangProducts.length === 0 && (
              <p className="text-sm text-zinc-500">Henüz Yang ilanı eklenmemiş.</p>
            )}
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-blue-500/30 bg-[#0b0d0d] p-5">
          <div className="mb-4">
            <h2 className="text-xl font-black text-blue-300">Hızlı DC Fiyat Yönetimi</h2>
            <p className="mt-1 text-sm text-zinc-400">DC paketlerini TL değil, oyun içi M değeriyle fiyatlandır. Örnek: 100 DC = 8 M.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dcProducts.map((product) => (
              <div key={product.id} className="rounded-lg border border-white/10 bg-black/50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div><p className="font-bold">{product.name}</p><p className="text-xs text-zinc-500">{product.server}</p></div>
                  <span className={product.is_active ? "text-xs text-emerald-400" : "text-xs text-red-400"}>{product.is_active ? "Yayında" : "Pasif"}</span>
                </div>
                <div className="flex gap-2">
                  <input type="number" min="0" step="0.01" value={quickDcPrices[product.id] ?? ""} placeholder="M değeri" onChange={(event) => setQuickDcPrices((current) => ({ ...current, [product.id]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2" />
                  <button type="button" onClick={() => updateQuickPrice(product, "DC")} disabled={quickSavingId === product.id} className="rounded-lg bg-blue-400 px-4 py-2 font-bold text-black disabled:opacity-60">{quickSavingId === product.id ? "..." : "Kaydet"}</button>
                </div>
              </div>
            ))}
            {dcProducts.length === 0 && <p className="text-sm text-zinc-500">Henüz DC ilanı eklenmemiş.</p>}
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-6 md:grid-cols-2"
        >
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={category === "dc" ? "Paket adı (ör. 100 DC)" : "Ürün adı (ör. 250M Yang)"} className="rounded-lg border border-white/10 bg-black px-4 py-3" />
          <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={category === "dc" ? "Satış fiyatı (M) — ör. 8" : "Fiyat (TL)"} className="rounded-lg border border-white/10 bg-black px-4 py-3" />
          <input type="number" min="0" step="0.01" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder={category === "dc" ? "Eski M fiyatı (isteğe bağlı)" : "Eski fiyat (isteğe bağlı, üzeri çizilir)"} className="rounded-lg border border-amber-500/30 bg-black px-4 py-3" />

          <select value={category} onChange={(e) => setCategory(e.target.value as Product["category"])} className="rounded-lg border border-white/10 bg-black px-4 py-3">
            <option value="item">Item Market</option>
            <option value="yang">Yang Market</option>
            <option value="dc">DC Satış</option>
            <option value="account">Hesap Market</option>
          </select>

          {category === "item" && (
            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-black px-4 py-3"
            >
              {ITEM_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}

          <select value={server} onChange={(e) => setServer(e.target.value as Product["server"])} className="rounded-lg border border-white/10 bg-black px-4 py-3">
            <option value="EPHESUS">EPHESUS</option>
            <option value="PERGAMON">PERGAMON</option>
            <option value="TEOS">TEOS</option>
          </select>

          <select value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="rounded-lg border border-cyan-500/30 bg-black px-4 py-3">
            <option value="30 dakika">Teslimat: 30 dakika</option>
            <option value="1 saat">Teslimat: 1 saat</option>
            <option value="2 saat">Teslimat: 2 saat</option>
            <option value="12 saat">Teslimat: 12 saat</option>
            <option value="24 saat">Teslimat: 24 saat</option>
          </select>

          <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stok" className="rounded-lg border border-white/10 bg-black px-4 py-3" />

          <div className="md:col-span-2">
            <ProductPresetPicker category={category} value={presetImage} onChange={(value) => { setPresetImage(value); setImageFile(null); setImagePreview(value); }} />
          </div>

          <div className="grid gap-3 md:col-span-2 sm:grid-cols-3">
            <label className="haswolf-admin-toggle"><input type="checkbox" checked={dailyFavorite} onChange={(e)=>setDailyFavorite(e.target.checked)}/><span>⭐ Bugünün Favorisi</span></label>
            <label className="haswolf-admin-toggle"><input type="checkbox" checked={bestPrice} onChange={(e)=>setBestPrice(e.target.checked)}/><span>🏆 En Uygun Fiyat</span></label>
            <label className="haswolf-admin-toggle"><input type="checkbox" checked={lowStockAlert} onChange={(e)=>setLowStockAlert(e.target.checked)}/><span>🔥 Stok Azalıyor</span></label>
          </div>

          <label className="rounded-lg border border-dashed border-[#8c641e] bg-black px-4 py-3">
            <span className="mb-2 block text-sm font-semibold text-[#e3b653]">Bilgisayardan görsel seç</span>
            <input type="file" accept="image/*" onChange={handleImageSelect} className="block w-full text-sm text-zinc-300" />
            <span className="mt-2 block text-xs text-zinc-500">JPG, PNG veya WEBP — en fazla 5 MB</span>
          </label>

          {imagePreview && (
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black md:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Ürün önizleme" className="max-h-72 w-full object-contain" />
            </div>
          )}

          {(category === "item" || category === "account") && (
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Admin özel açıklaması — yalnızca yönetici görür" className="min-h-24 rounded-lg border border-red-500/30 bg-red-950/10 px-4 py-3 md:col-span-2" />
          )}

          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Açıklama" className="min-h-28 rounded-lg border border-white/10 bg-black px-4 py-3 md:col-span-2" />

          <button disabled={saving} className="rounded-lg bg-gradient-to-r from-[#8b5d18] to-[#d1a13d] px-5 py-4 font-black text-black md:col-span-2">
            {saving ? "Kaydediliyor..." : editingId !== null ? "Değişiklikleri Kaydet" : "Ürünü Ekle"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-zinc-600 px-5 py-3 text-zinc-300 md:col-span-2"
            >
              Düzenlemeyi İptal Et
            </button>
          )}
        </form>

        {message && <p className="mt-4 rounded-lg border border-[#765625]/40 bg-black/40 p-4 text-sm">{message}</p>}

        <div className="mt-8 overflow-x-auto rounded-xl border border-[#765625]/50 bg-[#0b0d0d]">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-[#765625]/50 text-[#ddb45b]">
              <tr>
                <th className="p-4">Görsel</th>
                <th className="p-4">Ürün</th>
                <th className="p-4">Market</th>
                <th className="p-4">Alt Kategori</th>
                <th className="p-4">Sunucu</th>
                <th className="p-4">Fiyat</th><th className="p-4">Eski Fiyat</th><th className="p-4">Admin Notu</th>
                <th className="p-4">Stok</th>
                <th className="p-4">Durum</th>
                <th className="p-4">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-white/5">
                  <td className="p-4">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <span className="text-zinc-600">Yok</span>
                    )}
                  </td>
                  <td className="p-4 font-semibold">{product.name}</td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4">{product.category === "item" ? product.item_category ?? "Diğer" : "—"}</td>
                  <td className="p-4">{product.server}</td>
                  <td className="p-4">{Number(product.price).toLocaleString("tr-TR")} {product.category === "dc" ? "M" : "TL"}</td><td className="p-4">{product.old_price ? `${Number(product.old_price).toLocaleString("tr-TR")} ${product.category === "dc" ? "M" : "TL"}` : "—"}</td><td className="max-w-[220px] truncate p-4" title={product.admin_note ?? ""}>{product.admin_note ?? "—"}</td>
                  <td className="p-4">{product.stock}</td>
                  <td className="p-4">{product.is_active ? "Yayında" : "Pasif"}</td>
                  <td className="flex flex-wrap gap-2 p-4">
                    <button onClick={() => startEditing(product)} className="rounded border border-blue-500/40 px-3 py-2 text-blue-300">
                      Düzenle
                    </button>
                    <button onClick={() => toggleProduct(product)} className="rounded border border-amber-500/40 px-3 py-2 text-amber-300">
                      {product.is_active ? "Pasife Al" : "Yayınla"}
                    </button>
                    <button onClick={() => deleteProduct(product)} className="rounded border border-red-500/40 px-3 py-2 text-red-300">
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-zinc-500">Henüz ürün eklenmemiş.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section></main>
  );
}