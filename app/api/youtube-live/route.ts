import { NextResponse } from "next/server";

const CHANNEL_URL = "https://www.youtube.com/@ROYALEONLINEHASWOLF/live";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(CHANNEL_URL, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      },
    });

    const finalUrl = response.url;
    const urlVideoId = new URL(finalUrl).searchParams.get("v");

    if (urlVideoId && finalUrl.includes("/watch")) {
      return NextResponse.json(
        { live: true, videoId: urlVideoId },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const html = await response.text();
    const liveNow = html.includes('"isLiveNow":true');

    if (liveNow) {
      const liveIndex = html.indexOf('"isLiveNow":true');
      const nearby = html.slice(Math.max(0, liveIndex - 5000), liveIndex + 1000);
      const matches = [...nearby.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
      const videoId = matches.at(-1)?.[1] ?? null;

      if (videoId) {
        return NextResponse.json(
          { live: true, videoId },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    return NextResponse.json(
      { live: false, videoId: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { live: false, videoId: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
