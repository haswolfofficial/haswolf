import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/server-supabase";

function getClientIp(request: NextRequest) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

function hash(value: string) {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT tanımlı değil.");
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

function guestCredentials(deviceId: string) {
  const deviceHash = hash(`device:${deviceId}`);
  const password = `Hw!${hash(`guest-login:${deviceId}`).slice(0, 40)}`;
  const email = `${deviceHash.slice(0, 40)}@guest.haswolf.com`;
  return { deviceHash, email, password };
}

async function createRecoverableSession(userId: string, deviceId: string) {
  const supabase = createServiceClient();
  const { email, password } = guestCredentials(deviceId);

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    email,
    password,
    email_confirm: true,
  });
  if (updateError) throw updateError;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error || new Error("Misafir oturumu geri yüklenemedi.");
  return data.session;
}

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get("x-device-id")?.trim();
    if (!deviceId || deviceId.length < 16) {
      return NextResponse.json({ error: "Cihaz anahtarı eksik." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const ipHash = hash(getClientIp(request));
    const { deviceHash } = guestCredentials(deviceId);
    const { data: existing, error } = await supabase
      .from("profiles")
      .select("id,nickname")
      .eq("is_guest", true)
      .or(`device_hash.eq.${deviceHash},ip_hash.eq.${ipHash}`)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!existing) return NextResponse.json({ found: false });

    return NextResponse.json({ found: true, nickname: existing.nickname ?? "Misafir" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Misafir hesabı aranamadı." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const deviceId = request.headers.get("x-device-id")?.trim();
    if (!deviceId || deviceId.length < 16) {
      return NextResponse.json({ error: "Cihaz anahtarı eksik." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({})) as { action?: string };
    const supabase = createServiceClient();
    const ipHash = hash(getClientIp(request));
    const { deviceHash } = guestCredentials(deviceId);

    if (body.action === "resume") {
      const { data: existing, error } = await supabase
        .from("profiles")
        .select("id,nickname")
        .eq("is_guest", true)
        .or(`device_hash.eq.${deviceHash},ip_hash.eq.${ipHash}`)
          .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!existing) return NextResponse.json({ error: "Bu cihaz için kayıtlı misafir bulunamadı." }, { status: 404 });

      const session = await createRecoverableSession(existing.id, deviceId);
      return NextResponse.json({ nickname: existing.nickname ?? "Misafir", session });
    }

    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Oturum anahtarı eksik." }, { status: 401 });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user || !data.user.is_anonymous) {
      return NextResponse.json({ error: "Geçersiz misafir oturumu." }, { status: 401 });
    }

    const { data: ban } = await supabase
      .from("ip_bans")
      .select("id,reason,expires_at")
      .eq("ip_hash", ipHash)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();
    if (ban) return NextResponse.json({ error: ban.reason || "Bu bağlantı topluluktan yasaklanmış." }, { status: 403 });

    const { data: existing } = await supabase
      .from("profiles")
      .select("id,nickname")
      .eq("is_guest", true)
      .or(`ip_hash.eq.${ipHash},device_hash.eq.${deviceHash}`)
      .neq("id", data.user.id)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({
        error: "Bu cihaz veya bağlantı için daha önce bir misafir hesabı açılmış.",
        existingNickname: existing.nickname ?? "Misafir",
      }, { status: 409 });
    }

    const { data: nickname, error: nicknameError } = await supabase.rpc("allocate_guest_nickname");
    if (nicknameError) throw nicknameError;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      nickname,
      role: "member",
      is_banned: false,
      is_guest: true,
      ip_hash: ipHash,
      device_hash: deviceHash,
    }, { onConflict: "id" });
    if (profileError) throw profileError;

    const session = await createRecoverableSession(data.user.id, deviceId);
    return NextResponse.json({ nickname, session });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Misafir oluşturulamadı." }, { status: 500 });
  }
}
