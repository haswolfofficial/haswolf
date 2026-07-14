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

function candidateVideoIds(html: string) {
  const ids = new Set<string>();
  for (const match of html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)) {
    ids.add(match[1]);
  }
  return [...ids];
}

function looksLive(html: string, videoId: string) {
  const indexes: number[] = [];
  let index = html.indexOf(`"videoId":"${videoId}"`);
  while (index >= 0) {
    indexes.push(index);
    index = html.indexOf(`"videoId":"${videoId}"`, index + 1);
  }

  return indexes.some((position) => {
    const nearby = html.slice(Math.max(0, position - 7000), position + 14000);
    return (
      nearby.includes('"isLiveNow":true') ||
      nearby.includes('"isLive":true') ||
      nearby.includes('"style":"LIVE"') ||
      nearby.includes('"label":"LIVE"') ||
      nearby.includes('"text":"CANLI"')
    );
  });
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

async function videoBelongsToChannel(videoId: string, expectedChannelId: string) {
  const response = await fetchYouTube(`https://www.youtube.com/watch?v=${videoId}`);
  const html = await response.text();
  const ownerChannelId =
    html.match(/"ownerChannelName":"[^"]*","externalChannelId":"(UC[a-zA-Z0-9_-]+)"/)?.[1] ??
    html.match(/"externalChannelId":"(UC[a-zA-Z0-9_-]+)"/)?.[1] ??
    html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/)?.[1] ??
    null;

  const live =
    html.includes('"isLiveContent":true') ||
    html.includes('"isLiveNow":true') ||
    html.includes('"isLive":true');

  return ownerChannelId === expectedChannelId && live;
}

export async function GET() {
  try {
    const channelResponse = await fetchYouTube(CHANNEL_URL);
    const channelHtml = await channelResponse.text();
    const expectedChannelId = extractChannelId(channelHtml);

    if (!expectedChannelId) {
      return NextResponse.json(
        { live: false, videoId: null, reason: "channel-id-not-found" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const liveResponse = await fetchYouTube(LIVE_URL);
    const liveHtml = await liveResponse.text();
    const resolvedLiveChannelId = extractChannelId(liveHtml);

    if (resolvedLiveChannelId && resolvedLiveChannelId !== expectedChannelId) {
      return NextResponse.json(
        { live: false, videoId: null, reason: "channel-mismatch" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const redirectedVideoId = (() => {
      try {
        const parsed = new URL(liveResponse.url);
        return parsed.pathname === "/watch" ? parsed.searchParams.get("v") : null;
      } catch {
        return null;
      }
    })();

    const candidates = [
      redirectedVideoId,
      ...candidateVideoIds(liveHtml).filter((id) => looksLive(liveHtml, id)),
      ...candidateVideoIds(channelHtml).filter((id) => looksLive(channelHtml, id)),
    ].filter((id): id is string => Boolean(id));

    for (const videoId of [...new Set(candidates)].slice(0, 8)) {
      if (await videoBelongsToChannel(videoId, expectedChannelId)) {
        return NextResponse.json(
          { live: true, videoId, channelId: expectedChannelId },
          { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
        );
      }
    }

    return NextResponse.json(
      { live: false, videoId: null, channelId: expectedChannelId },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("YouTube live check failed:", error);
    return NextResponse.json(
      { live: false, videoId: null },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
