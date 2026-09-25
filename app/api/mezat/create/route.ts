import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "../../../../lib/server-supabase";

function getBearer(request: NextRequest) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearer(request);
    if (!token) return NextResponse.json({ error: "Yetkilendirme gerekli." }, { status: 401 });

    const supabase = createServiceClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) return NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 });

    const { data: admin } = await supabase
      .from("admin_members")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const founder = (user.email || "").toLowerCase() === "haswolf666@gmail.com";
    if (!admin && !founder) return NextResponse.json({ error: "Admin yetkisi gerekli." }, { status: 403 });

    const body = await request.json();
    const productId = Number(body.productId);
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim() || null;
    const server = String(body.server || "EPHESUS");
    const startPrice = Number(body.startPrice);
    const minIncrement = Number(body.minIncrement);
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    const extensionSeconds = Number(body.extensionSeconds ?? 30);
    const maxExtensionSeconds = Number(body.maxExtensionSeconds ?? 300);

    if (!Number.isInteger(productId) || !title || !Number.isFinite(startPrice) || startPrice <= 0 ||
        !Number.isFinite(minIncrement) || minIncrement <= 0 ||
        !Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
      return NextResponse.json({ error: "Mezat bilgileri geçersiz." }, { status: 400 });
    }

    if (!["EPHESUS", "PERGAMON", "TEOS"].includes(server)) {
      return NextResponse.json({ error: "Geçersiz sunucu." }, { status: 400 });
    }

    const { data: auction, error } = await supabase
      .from("auctions")
      .insert({
        product_id: productId,
        title,
        description,
        server,
        start_price: startPrice,
        current_price: startPrice - minIncrement,
        min_increment: minIncrement,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        extension_seconds: Math.min(300, Math.max(5, extensionSeconds)),
        max_extension_seconds: Math.min(3600, Math.max(0, maxExtensionSeconds)),
        status: startsAt > new Date() ? "scheduled" : "active",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, auction });
  } catch {
    return NextResponse.json({ error: "Mezat oluşturulamadı." }, { status: 500 });
  }
}
