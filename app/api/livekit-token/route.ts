import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const roomName = String(body.roomName || "").trim();
    const participantName = String(body.participantName || "").trim();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: "Oda adı ve mahlas zorunludur." },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "LiveKit ayarları eksik." },
        { status: 500 }
      );
    }

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: `${participantName}-${crypto.randomUUID()}`,
      name: participantName,
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
    console.error("LiveKit token hatası:", error);

    return NextResponse.json(
      { error: "Ses odası bağlantısı oluşturulamadı." },
      { status: 500 }
    );
  }
}