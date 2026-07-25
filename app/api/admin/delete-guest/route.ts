import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createServiceClient } from "@/lib/server-supabase";
import { hasAdminAccess } from "@/lib/admin-access";

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "YÃ¶netici oturumu gerekli." },
        { status: 401 },
      );
    }

    const supabase = createServiceClient();
    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "GeÃ§ersiz yÃ¶netici oturumu." },
        { status: 401 },
      );
    }

    if (!(await hasAdminAccess(authData.user))) {
      return NextResponse.json(
        { error: "Bu iÅŸlem iÃ§in yÃ¶netici yetkisi gerekli." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      userId?: string;
      roomName?: string;
      participantIdentity?: string;
    };

    if (!body.userId) {
      return NextResponse.json(
        { error: "Silinecek misafir kimliÄŸi eksik." },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,is_guest,nickname")
      .eq("id", body.userId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile?.is_guest) {
      return NextResponse.json(
        { error: "YalnÄ±zca misafir hesaplarÄ± bu iÅŸlemle silinebilir." },
        { status: 400 },
      );
    }

    if (body.roomName && body.participantIdentity) {
      const livekitUrl = process.env.LIVEKIT_URL;
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (livekitUrl && apiKey && apiSecret) {
        const serviceUrl = livekitUrl
          .replace(/^wss:/i, "https:")
          .replace(/^ws:/i, "http:");
        const roomService = new RoomServiceClient(
          serviceUrl,
          apiKey,
          apiSecret,
        );
        await roomService
          .removeParticipant(body.roomName, body.participantIdentity)
          .catch(() => undefined);
      }
    }

    await supabase
      .from("community_presence")
      .delete()
      .eq("user_id", body.userId);

    await supabase
      .from("community_members")
      .delete()
      .eq("user_id", body.userId);

    await supabase.from("profiles").delete().eq("id", body.userId);

    const { error: deleteAuthError } =
      await supabase.auth.admin.deleteUser(body.userId);

    if (deleteAuthError) throw deleteAuthError;

    return NextResponse.json({
      ok: true,
      message:
        "Misafir oturumu silindi. AynÄ± kiÅŸi daha sonra yeniden misafir olarak katÄ±labilir.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Misafir hesabÄ± silinemedi.",
      },
      { status: 500 },
    );
  }
}
