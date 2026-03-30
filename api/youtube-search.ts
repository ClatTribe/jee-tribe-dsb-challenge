import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Serverless Function: YouTube Search Proxy
 *
 * Searches YouTube via the internal `youtubei/v1/search` API.
 * This runs server-side so there are no CORS restrictions.
 *
 * Query params:
 *   q - search query string
 *
 * Returns: JSON array of { title, channelName, videoId }
 */

interface VideoResult {
  title: string;
  channelName: string;
  videoId: string;
}

async function searchYouTube(query: string): Promise<VideoResult[]> {
  const url = "https://www.youtube.com/youtubei/v1/search";

  const body = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20240101.00.00",
        hl: "en",
        gl: "IN",
      },
    },
    query: query,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`YouTube API returned ${response.status}`);
  }

  const data = await response.json();

  // Parse the nested YouTube response structure
  const videos: VideoResult[] = [];

  try {
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents;

    if (!contents) return [];

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (!items) continue;

      for (const item of items) {
        const renderer = item?.videoRenderer;
        if (!renderer) continue;

        const videoId = renderer.videoId;
        const title =
          renderer.title?.runs?.map((r: any) => r.text).join("") || "";
        const channelName =
          renderer.ownerText?.runs?.[0]?.text ||
          renderer.longBylineText?.runs?.[0]?.text ||
          "Unknown Channel";

        if (videoId && title) {
          videos.push({ title, channelName, videoId });
        }

        if (videos.length >= 10) break;
      }

      if (videos.length >= 10) break;
    }
  } catch (e) {
    console.error("Error parsing YouTube response:", e);
  }

  return videos;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const query = req.query.q as string;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const videos = await searchYouTube(query);
    return res.status(200).json({ videos });
  } catch (error: any) {
    console.error("YouTube search error:", error);
    return res
      .status(500)
      .json({ error: "Failed to search YouTube", message: error.message });
  }
}
