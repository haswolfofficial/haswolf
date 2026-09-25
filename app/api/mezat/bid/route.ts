import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearer(request: NextRequest) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearer(request);
    if (!token) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const body = await request.json();
    const auctionId = String(body.auctionId || "");
    const amount = Number(body.amount);

    if (!auctionId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Geçersiz teklif." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
    }

    const client = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await client.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 });
    }

    const { data, error } = await client.rpc("place_auction_bid", {
      p_auction_id: auctionId,
      p_amount: amount,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch {
    return NextResponse.json({ error: "Teklif işlenirken bir hata oluştu." }, { status: 500 });
  }
}
