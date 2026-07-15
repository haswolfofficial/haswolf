import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/server-supabase";

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function hashIp(ip: string) {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT tanımlı değil.");
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

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

    if (error || !data.user || !data.user.is_anonymous) {
      return NextResponse.json({ error: "Geçersiz misafir oturumu." }, { status: 401 });
    }

    const ipHash = hashIp(getClientIp(request));
    const { data: ban } = await supabase
      .from("ip_bans")
      .select("id,reason,expires_at")
      .eq("ip_hash", ipHash)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();

    if (ban) {
      return NextResponse.json(
        { error: ban.reason || "Bu bağlantı topluluktan yasaklanmış." },
        { status: 403 },
      );
    }

    const { data: nickname, error: nicknameError } = await supabase.rpc(
      "allocate_guest_nickname",
    );
    if (nicknameError) throw nicknameError;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        nickname,
        role: "member",
        is_banned: false,
        is_guest: true,
        ip_hash: ipHash,
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    return NextResponse.json({ nickname });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Misafir oluşturulamadı." },
      { status: 500 },
    );
  }
}
