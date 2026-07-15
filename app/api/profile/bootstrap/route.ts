import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/server-supabase";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json({ error: "Oturum anahtarı eksik." }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id,nickname,is_banned,is_guest")
      .eq("id", data.user.id)
      .maybeSingle();

    if (existing) return NextResponse.json({ profile: existing });

    const suggested = data.user.email?.split("@")[0]?.slice(0, 20) || null;
    const { error: insertError } = await supabase.from("profiles").insert({
      id: data.user.id,
      nickname: null,
      role: data.user.email === "haswolf666@gmail.com" ? "admin" : "member",
      is_banned: false,
      is_guest: false,
    });
    if (insertError) throw insertError;

    return NextResponse.json({ profile: { id: data.user.id, nickname: null }, suggested });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Profil hazırlanamadı." },
      { status: 500 },
    );
  }
}
