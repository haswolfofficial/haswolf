import { NextResponse } from "next/server";

const HANDLE = "ROYALEONLINEHASWOLF";
const CHANNEL_URL = `https://www.youtube.com/@${HANDLE}`;
const LIVE_URL = `${CHANNEL_URL}/live`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

function extractChannelId(html: string) {
  return (
    html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/)?.[1] ??
    html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/)?.[1] ??
    html.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/)?.[1] ??
    null
  );
}

function extractLiveVideoId(html: string) {
  const directPatterns = [
    /"videoId":"([a-zA-Z0-9_-]{11})"[^]{0,12000}?"isLiveNow":true/,
    /"isLiveNow":true[^]{0,12000}?"videoId":"([a-zA-Z0-9_-]{11})"/,
    /"videoId":"([a-zA-Z0-9_-]{11})"[^]{0,12000}?"isLive":true/,
    /"isLive":true[^]{0,12000}?"videoId":"([a-zA-Z0-9_-]{11})"/,
  ];

  for (const pattern of directPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  const liveIndexCandidates = [
    html.indexOf('"isLiveNow":true'),
    html.indexOf('"isLive":true'),
    html.indexOf('"LIVE_STREAM_OFFLINE"'),
  ].filter((index) => index >= 0);

  for (const liveIndex of liveIndexCandidates) {
    const nearby = html.slice(Math.max(0, liveIndex - 30000), liveIndex + 30000);
    const ids = [...nearby.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    if (ids.length > 0) return ids.at(-1)?.[1] ?? null;
  }

  return null;
}

async function fetchYouTube(url: string) {
  return fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      Accept: "text/html,application/xhtml+xml",
    },
  });
}

export async function GET() {
  try {
    const liveResponse = await fetchYouTube(LIVE_URL);
    const liveHtml = await liveResponse.text();

    const redirectedVideoId = (() => {
      try {
        const parsed = new URL(liveResponse.url);
        return parsed.pathname === "/watch" ? parsed.searchParams.get("v") : null;
      } catch {
        return null;
      }
    })();

    let channelId = extractChannelId(liveHtml);
    let videoId = redirectedVideoId ?? extractLiveVideoId(liveHtml);

    if (!channelId) {
      const channelResponse = await fetchYouTube(CHANNEL_URL);
      const channelHtml = await channelResponse.text();
      channelId = extractChannelId(channelHtml);
      videoId = videoId ?? extractLiveVideoId(channelHtml);
    }

    return NextResponse.json(
      {
        live: Boolean(videoId),
        videoId,
        channelId,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { live: false, videoId: null, channelId: null },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
