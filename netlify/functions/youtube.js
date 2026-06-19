// Netlify function: YouTube sound search proxy.
// Holds YOUTUBE_API_KEY server-side so it never ships to the browser.
// search.list costs 100 quota units; default free quota = 100 searches/day.

function decodeEntities(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(parseInt(n, 10)));
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req) {
  let q = "";
  try {
    q = new URL(req.url).searchParams.get("q") || "";
  } catch (e) {}
  q = q.trim();

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return json({ error: "YOUTUBE_API_KEY is not set in Netlify environment variables." }, 500);
  if (!q) return json({ tracks: [] });

  const api =
    "https://www.googleapis.com/youtube/v3/search" +
    "?part=snippet&type=video&maxResults=8&videoEmbeddable=true&safeSearch=none" +
    "&q=" + encodeURIComponent(q) +
    "&key=" + key;

  try {
    const r = await fetch(api);
    const d = await r.json();
    if (d.error) {
      const msg = (d.error.errors && d.error.errors[0] && d.error.errors[0].reason) || d.error.message || "YouTube API error";
      return json({ error: msg }, 502);
    }
    const tracks = (d.items || [])
      .map((it) => {
        const id = it.id && it.id.videoId;
        const sn = it.snippet || {};
        const thumbs = sn.thumbnails || {};
        const thumb = (thumbs.medium && thumbs.medium.url) || (thumbs.default && thumbs.default.url) || "";
        return {
          id,
          title: decodeEntities(sn.title),
          channel: decodeEntities(sn.channelTitle),
          thumb,
          url: id ? "https://www.youtube.com/watch?v=" + id : "",
        };
      })
      .filter((t) => t.id);
    return json({ tracks });
  } catch (err) {
    return json({ error: err.message || "Request failed" }, 502);
  }
}
