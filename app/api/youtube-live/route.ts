import { NextResponse } from "next/server";

const CHANNEL_HANDLE = "ROYALEONLINEHASWOLF";
const CHANNEL_URL = "https://www.youtube.com/@ROYALEONLINEHASWOLF";
const CACHE_SECONDS = 900;

type YouTubeChannelsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      customUrl?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type YouTubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      channelId?: string;
      channelTitle?: string;
      liveBroadcastContent?: string;
      title?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type YouTubeVideosResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      channelId?: string;
      channelTitle?: string;
      liveBroadcastContent?: string;
      title?: string;
    };
    liveStreamingDetails?: {
      actualStartTime?: string;
      actualEndTime?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export const dynamic = "force-dynamic";

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
    },
  });
}

async function youtubeFetch<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY tanımlı değil.");
  }

  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);

  Object.entries({
    ...params,
    key: apiKey,
  }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    next: {
      revalidate: CACHE_SECONDS,
    },
    headers: {
      Accept: "application/json",
    },
  });

  const data = (await response.json()) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "YouTube API isteği başarısız.");
  }

  return data;
}

async function resolveExactChannelId() {
  const configuredChannelId = process.env.YOUTUBE_CHANNEL_ID?.trim();

  const channels = await youtubeFetch<YouTubeChannelsResponse>("channels", {
    part: "id,snippet",
    forHandle: CHANNEL_HANDLE,
    maxResults: "1",
  });

  const channel = channels.items?.[0];
  const resolvedChannelId = channel?.id?.trim();

  if (!resolvedChannelId) {
    throw new Error("HASWOLF YouTube kanalı çözülemedi.");
  }

  if (
    configuredChannelId &&
    configuredChannelId !== resolvedChannelId
  ) {
    throw new Error(
      "YOUTUBE_CHANNEL_ID, ROYALEONLINEHASWOLF kanal kimliğiyle eşleşmiyor."
    );
  }

  return {
    channelId: resolvedChannelId,
    channelTitle: channel?.snippet?.title || "Royale Online Haswolf",
  };
}

export async function GET() {
  try {
    const { channelId, channelTitle } = await resolveExactChannelId();

    const search = await youtubeFetch<YouTubeSearchResponse>("search", {
      part: "snippet",
      channelId,
      eventType: "live",
      type: "video",
      maxResults: "1",
      order: "date",
    });

    const searchItem = search.items?.[0];
    const candidateVideoId = searchItem?.id?.videoId?.trim();

    if (!candidateVideoId) {
      return jsonResponse({
        live: false,
        videoId: null,
        channelId,
        channelTitle,
        channelUrl: CHANNEL_URL,
      });
    }

    if (searchItem?.snippet?.channelId !== channelId) {
      return jsonResponse({
        live: false,
        videoId: null,
        channelId,
        channelTitle,
        channelUrl: CHANNEL_URL,
      });
    }

    const videos = await youtubeFetch<YouTubeVideosResponse>("videos", {
      part: "snippet,liveStreamingDetails",
      id: candidateVideoId,
      maxResults: "1",
    });

    const video = videos.items?.[0];

    const isExactChannel =
      video?.snippet?.channelId === channelId;

    const isActuallyLive =
      video?.snippet?.liveBroadcastContent === "live" &&
      Boolean(video?.liveStreamingDetails?.actualStartTime) &&
      !video?.liveStreamingDetails?.actualEndTime;

    if (!video?.id || !isExactChannel || !isActuallyLive) {
      return jsonResponse({
        live: false,
        videoId: null,
        channelId,
        channelTitle,
        channelUrl: CHANNEL_URL,
      });
    }

    return jsonResponse({
      live: true,
      videoId: video.id,
      channelId,
      channelTitle,
      videoTitle: video.snippet?.title || "HASWOLF canlı yayın",
      channelUrl: CHANNEL_URL,
    });
  } catch (error) {
    console.error("YouTube canlı yayın kontrolü başarısız:", error);

    return jsonResponse(
      {
        live: false,
        videoId: null,
        channelId: null,
        channelTitle: "Royale Online Haswolf",
        channelUrl: CHANNEL_URL,
        configurationError:
          error instanceof Error ? error.message : "Bilinmeyen YouTube API hatası.",
      },
      200
    );
  }
}
