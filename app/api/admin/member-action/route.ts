import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createServiceClient } from "@/lib/server-supabase";
import { hasAdminAccess } from "@/lib/admin-access";

type Action = "kick" | "ban" | "mute" | "unmute" | "role" | "speak" | "delete";

function createRoomService() {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!livekitUrl || !apiKey || !apiSecret) return null;
  return new RoomServiceClient(livekitUrl.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:"), apiKey, apiSecret);
}

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!bearer) return NextResponse.json({ error: "Yönetici oturumu gerekli." }, { status: 401 });

    const supabase = createServiceClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(bearer);
    if (authError || !authData.user) return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
    if (!(await hasAdminAccess(authData.user))) return NextResponse.json({ error: "Kurucu veya yönetici yetkisi gerekli." }, { status: 403 });

    const body = await request.json() as { action?: Action; userId?: string; roomName?: string; participantIdentity?: string; value?: string | boolean; reason?: string };
    if (!body.action || !body.userId) return NextResponse.json({ error: "İşlem ve üye zorunludur." }, { status: 400 });
    if (body.userId === authData.user.id) return NextResponse.json({ error: "Kendi hesabında bu işlem uygulanamaz." }, { status: 400 });

    if ((body.action === "kick" || body.action === "ban" || body.action === "delete") && body.roomName) {
      await createRoomService()?.removeParticipant(body.roomName, body.participantIdentity || body.userId).catch(() => undefined);
    }

    if (body.action === "delete") {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(body.userId);
      if (deleteError) throw deleteError;
      return NextResponse.json({ ok: true });
    }

    const roomService = createRoomService();
    if ((body.action === "speak" || body.action === "mute" || body.action === "unmute") && body.roomName && roomService) {
      const { data: targetProfile } = await supabase.from("profiles").select("can_speak").eq("id", body.userId).maybeSingle();
      const canPublish = body.action === "speak" ? Boolean(body.value) : body.action === "unmute" ? Boolean(targetProfile?.can_speak) : false;
      await roomService.updateParticipant(body.roomName, body.participantIdentity || body.userId, {
        permission: { canPublish, canSubscribe: true, canPublishData: true },
      }).catch(() => undefined);
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.action === "ban") {
      const banned = body.value !== false;
      updates.banned_until = banned ? "9999-12-31T23:59:59Z" : null;
      updates.is_banned = banned;
    }
    if (body.action === "mute" || body.action === "unmute") {
      const muted = body.action === "mute";
      updates.is_muted = muted;
      updates.muted_until = muted ? "9999-12-31T23:59:59Z" : null;
    }
    if (body.action === "speak") updates.can_speak = Boolean(body.value);
    if (body.action === "role") {
      const roleName = String(body.value || "Üye");
      const { data: role, error: roleError } = await supabase.from("roles").select("id,name").ilike("name", roleName).maybeSingle();
      if (roleError || !role) return NextResponse.json({ error: `${roleName} rolü bulunamadı.` }, { status: 400 });
      const { error: removeRoleError } = await supabase.from("user_roles").delete().eq("user_id", body.userId);
      if (removeRoleError) throw removeRoleError;
      const { error: addRoleError } = await supabase.from("user_roles").insert({ user_id: body.userId, role_id: role.id, expires_at: null });
      if (addRoleError) throw addRoleError;
      updates.community_role = role.name.toLocaleLowerCase("tr-TR");
    }

    if (Object.keys(updates).length > 1) {
      const { error } = await supabase.from("profiles").update(updates).eq("id", body.userId);
      if (error) throw error;
    }

    await supabase.from("moderation_actions").insert({
      actor_id: authData.user.id,
      target_user_id: body.userId,
      action: body.action,
      reason: String(body.reason || ""),
      room_name: body.roomName || null,
      metadata: { value: body.value ?? null, participantIdentity: body.participantIdentity ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Üye işlemi tamamlanamadı." }, { status: 500 });
  }
}
