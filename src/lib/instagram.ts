export const INSTAGRAM_PROFILE_URL =
  "https://www.instagram.com/jackalsvolleyball/";

export type InstagramPost = {
  id: string;
  caption?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  imageUrl: string;
  permalink: string;
  timestamp: string;
};

type InstagramMediaItem = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

type InstagramMediaResponse = {
  data?: InstagramMediaItem[];
  error?: { message: string };
};

function getImageUrl(item: InstagramMediaItem): string | undefined {
  if (item.media_type === "VIDEO") {
    return item.thumbnail_url;
  }
  return item.media_url;
}

export async function getInstagramPosts(
  limit = 6,
): Promise<InstagramPost[]> {
  const userId = process.env.INSTAGRAM_USER_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!userId || !accessToken) {
    return [];
  }

  const fields =
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
  const url = new URL(`https://graph.instagram.com/${userId}/media`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", accessToken);

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      console.error("Instagram API error:", response.status);
      return [];
    }

    const data: InstagramMediaResponse = await response.json();

    if (data.error || !data.data) {
      console.error("Instagram API error:", data.error?.message);
      return [];
    }

    return data.data.flatMap((item) => {
      const imageUrl = getImageUrl(item);
      if (!imageUrl) {
        return [];
      }

      return [
        {
          id: item.id,
          caption: item.caption,
          mediaType: item.media_type as InstagramPost["mediaType"],
          imageUrl,
          permalink: item.permalink,
          timestamp: item.timestamp,
        },
      ];
    });
  } catch (error) {
    console.error("Failed to fetch Instagram posts:", error);
    return [];
  }
}
