import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createServiceClient } from "@/lib/server-supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomName = String(body.roomName || "").trim();
    const participantName = String(body.participantName || "").trim();
    const userId = String(body.userId || "").trim();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: "Oda adÄ± ve mahlas zorunludur." },
        { status: 400 },
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "LiveKit ayarlarÄ± eksik." },
        { status: 500 },
      );
    }

    let isGuest = false;
    if (userId) {
      const supabase = createServiceClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_guest")
        .eq("id", userId)
        .maybeSingle();
      isGuest = Boolean(profile?.is_guest);
    }

    const identity = userId || `guest-${crypto.randomUUID()}`;
    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity,
      name: participantName,
      metadata: JSON.stringify({ userId: identity, isGuest }),
      ttl: "2h",
    });

    accessToken.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return NextResponse.json({
      token: await accessToken.toJwt(),
      serverUrl: livekitUrl,
    });
  } catch (error) {
    console.error("LiveKit token hatasÄ±:", error);
    return NextResponse.json(
      { error: "Ses odasÄ± baÄŸlantÄ±sÄ± oluÅŸturulamadÄ±." },
      { status: 500 },
    );
  }
}
