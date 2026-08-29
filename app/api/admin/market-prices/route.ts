import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/server-supabase";

const SERVERS = ["EPHESUS", "PERGAMON", "TEOS"] as const;
const DEFAULT_YANG_UNIT = { EPHESUS: 9.5, PERGAMON: 9, TEOS: 8.75 } as const;
const DEFAULT_DC_PRICE = { EPHESUS: 8, PERGAMON: 8.5, TEOS: 9 } as const;
const FOUNDER_EMAIL = "haswolf666@gmail.com";

type ServerName = (typeof SERVERS)[number];

type PriceBody = {
  category?: "yang" | "dc";
  server?: ServerName;
  value?: number;
};

async function requireAdmin(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) throw new Error("Yönetici oturumu gerekli.");

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(bearer);
  if (error || !data.user) throw new Error("Geçersiz yönetici oturumu.");

  const email = (data.user.email || "").toLowerCase();
  if (email !== FOUNDER_EMAIL) {
    const { data: member } = await supabase
      .from("admin_members")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!member) throw new Error("Bu işlem için yönetici yetkisi gerekli.");
  }

  return { supabase, user: data.user };
}

async function ensureDefaults(supabase: ReturnType<typeof createServiceClient>, userId: string) {
  const { data: existing, error } = await supabase
    .from("products")
    .select("id,name,category,server,price,is_active")
    .in("category", ["yang", "dc"]);
  if (error) throw error;

  const rows = existing ?? [];

  for (const server of SERVERS) {
    const yang = rows.find((row) => row.category === "yang" && row.server === server);
    if (yang) {
      const looksLikeUnit = Number(yang.price) > 0 && Number(yang.price) < 100;
      const targetPrice = looksLikeUnit ? Number(yang.price) * 1000 : Number(yang.price);
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: "1 T (1000 M)",
          price: targetPrice || DEFAULT_YANG_UNIT[server] * 1000,
          stock: 1000000,
          is_active: true,
          delivery_time: "1 saat",
          image_url: "/images/product-presets/yang/yang-1.svg",
        })
        .eq("id", yang.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("products").insert({
        name: "1 T (1000 M)",
        category: "yang",
        item_category: null,
        server,
        price: DEFAULT_YANG_UNIT[server] * 1000,
        old_price: null,
        admin_note: null,
        description: "İstediğin M miktarını gir; toplam fiyat otomatik hesaplanır.",
        image_url: "/images/product-presets/yang/yang-1.svg",
        stock: 1000000,
        is_active: true,
        delivery_time: "1 saat",
        created_by: userId,
      });
      if (insertError) throw insertError;
    }

    const dc = rows.find((row) => row.category === "dc" && row.server === server);
    if (dc) {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: "100 DC",
          stock: 1000000,
          is_active: true,
          delivery_time: "1 saat",
          image_url: "/images/product-presets/dc/dc-1.svg",
        })
        .eq("id", dc.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("products").insert({
        name: "100 DC",
        category: "dc",
        item_category: null,
        server,
        price: DEFAULT_DC_PRICE[server],
        old_price: null,
        admin_note: null,
        description: "100 DC karşılığı M fiyatı.",
        image_url: "/images/product-presets/dc/dc-1.svg",
        stock: 1000000,
        is_active: true,
        delivery_time: "1 saat",
        created_by: userId,
      });
      if (insertError) throw insertError;
    }
  }
}

async function getPrices(supabase: ReturnType<typeof createServiceClient>) {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,category,server,price,is_active")
    .in("category", ["yang", "dc"])
    .in("server", SERVERS as unknown as string[])
    .order("server", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireAdmin(request);
    await ensureDefaults(supabase, user.id);
    return NextResponse.json({ ok: true, products: await getPrices(supabase) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fiyatlar hazırlanamadı.";
    const status = /oturumu|yetkisi/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAdmin(request);
    await ensureDefaults(supabase, user.id);
    const body = (await request.json()) as PriceBody;

    if (!body.category || !body.server || !SERVERS.includes(body.server) || !Number.isFinite(body.value) || Number(body.value) <= 0) {
      return NextResponse.json({ error: "Geçerli kategori, sunucu ve fiyat gerekli." }, { status: 400 });
    }

    const { data: product, error: findError } = await supabase
      .from("products")
      .select("id")
      .eq("category", body.category)
      .eq("server", body.server)
      .maybeSingle();
    if (findError || !product) throw findError || new Error("Fiyat kaydı bulunamadı.");

    const price = body.category === "yang" ? Number(body.value) * 1000 : Number(body.value);
    const { error: updateError } = await supabase
      .from("products")
      .update({ price, is_active: true, stock: 1000000 })
      .eq("id", product.id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, products: await getPrices(supabase) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fiyat güncellenemedi.";
    const status = /oturumu|yetkisi/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
