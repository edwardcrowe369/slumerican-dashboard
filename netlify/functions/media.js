import { getStore } from "@netlify/blobs";
const STORE_PREFIX = process.env.BRAND_SLUG || "brand";

// Netlify Function (v2): /.netlify/functions/media?id=<postId>&i=<index>
// Serves a post's image (stored as a base64 data URI in the shared board)
// at a public URL so external services (e.g. Ayrshare) can fetch it.
// Responds to HEAD (used for verification) and GET.

function getBoard() {
  try {
    return getStore({ name: STORE_PREFIX + "-board", consistency: "strong" });
  } catch (err) {
    console.error("Blobs init failed:", err.message);
    return null;
  }
}

export default async function handler(req) {
  const method = req.method || "GET";

  let id = "", i = 0;
  try {
    const u = new URL(req.url);
    id = (u.searchParams.get("id") || "").trim();
    i = parseInt(u.searchParams.get("i") || "0", 10);
    if (Number.isNaN(i) || i < 0) i = 0;
  } catch (e) {}
  if (!id) return new Response("missing id", { status: 400 });

  const store = getBoard();
  if (!store) return new Response("store error", { status: 503 });

  let board;
  try {
    board = await store.get("board", { type: "json" });
  } catch (e) {
    return new Response("read error", { status: 500 });
  }
  if (!board || !Array.isArray(board.posts)) return new Response("no board", { status: 404 });

  const post = board.posts.find((p) => String(p.id) === id);
  if (!post || !Array.isArray(post.images) || !post.images[i]) {
    return new Response("not found", { status: 404 });
  }

  const dataUri = post.images[i];
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUri);
  if (!m) return new Response("unsupported media", { status: 415 });

  const contentType = m[1];
  const bytes = Buffer.from(m[2], "base64");

  const headers = {
    "Content-Type": contentType,
    "Content-Length": String(bytes.length),
    "Cache-Control": "public, max-age=300",
    "Access-Control-Allow-Origin": "*",
  };

  if (method === "HEAD") return new Response("", { status: 200, headers });
  return new Response(new Uint8Array(bytes), { status: 200, headers });
}
