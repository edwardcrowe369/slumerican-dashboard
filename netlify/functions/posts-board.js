import { getStore } from "@netlify/blobs";
const STORE_PREFIX = process.env.BRAND_SLUG || "brand";

let boardCache = null;

function getBlobs() {
  try {
    return getStore({ name: STORE_PREFIX + "-board", consistency: "strong" });
  } catch (err) {
    console.error("Blobs init failed:", err.message);
    return null;
  }
}

async function readBoard(store) {
  if (!store) return null;
  try {
    const data = await store.get("board");
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Blobs read failed:", err.message);
    return null;
  }
}

async function writeBoard(store, data) {
  if (!store) return false;
  try {
    await store.setJSON("board", data);
    return true;
  } catch (err) {
    console.error("Blobs write failed:", err.message);
    return false;
  }
}

function cleanSound(s) {
  if (!s || !s.videoId) return null;
  const num = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  return {
    videoId: String(s.videoId).substring(0, 32),
    title: (s.title || "").substring(0, 300),
    channel: (s.channel || "").substring(0, 200),
    thumb: typeof s.thumb === "string" ? s.thumb : "",
    url: typeof s.url === "string" ? s.url : "",
    start: num(s.start) || 0,
    end: num(s.end),
  };
}

function cleanPost(p) {
  const platforms = Array.isArray(p.platforms)
    ? p.platforms.map(String)
    : (p.platform ? [String(p.platform)] : []);
  return {
    id: String(p.id || ""),
    images: Array.isArray(p.images) ? p.images.slice(0, 20) : [],
    frame: p.frame || "feed",
    contentType: p.contentType || "art",
    caption: (p.caption || "").substring(0, 5000),
    platforms,
    sound: cleanSound(p.sound),
    status: p.status || "draft",
    day: p.day || "",
    time: p.time || "",
    reviewId: p.reviewId || "",
    reviewUrl: p.reviewUrl || "",
    reviewDecision: p.reviewDecision || null,
    reviewComment: p.reviewComment || "",
    reviewer: p.reviewer || "",
    reviewedAt: p.reviewedAt || null,
    createdAt: p.createdAt || Date.now(),
  };
}

function cleanLib(it) {
  return {
    id: String(it.id || ""),
    src: typeof it.src === "string" ? it.src : "",
  };
}

function cleanArt(it) {
  const allowed = { pending: 1, approved: 1, denied: 1, flagged: 1 };
  return {
    id: String(it.id || ""),
    src: typeof it.src === "string" ? it.src : "",
    status: allowed[it.status] ? it.status : "pending",
    comment: (it.comment || "").substring(0, 2000),
    createdAt: it.createdAt || Date.now(),
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function payload(board) {
  return { rev: board.rev, posts: board.posts, library: board.library, artboard: board.artboard };
}

async function loadBoard(store) {
  let board = await readBoard(store);
  if (!board) board = boardCache;
  if (!board) {
    board = { rev: 0, posts: [], library: [], artboard: [], updatedAt: new Date().toISOString() };
    if (store) await writeBoard(store, board);
  }
  if (!Array.isArray(board.posts)) board.posts = [];
  if (!Array.isArray(board.library)) board.library = [];
  if (!Array.isArray(board.artboard)) board.artboard = [];
  boardCache = board;
  return board;
}

async function saveBoard(store, board) {
  board.rev++;
  board.updatedAt = new Date().toISOString();
  boardCache = board;
  if (store) await writeBoard(store, board);
  return board;
}

export default async function handler(req, context) {
  const method = req.method || "GET";
  let rev = -1;
  try {
    const url = new URL(req.url);
    const r = url.searchParams.get("rev");
    rev = parseInt(r != null ? r : "-1", 10);
    if (Number.isNaN(rev)) rev = -1;
  } catch (e) {
    rev = -1;
  }

  try {
    const store = getBlobs();
    let board = await loadBoard(store);

    if (method === "GET") {
      if (rev === board.rev) {
        return json({ rev: board.rev, changed: false });
      }
      return json(payload(board));
    }

    if (method === "POST") {
      let body = {};
      try {
        body = await req.json();
      } catch (e) {
        return json({ error: "Invalid JSON" }, 400);
      }

      const { action: act, post, posts: seedPosts } = body;
      const postId = body.postId || body.id;

      if (act === "seed" && board.posts.length === 0 && seedPosts) {
        board.posts = seedPosts.map(cleanPost).slice(0, 300);
        if (Array.isArray(body.library)) {
          board.library = body.library.map(cleanLib).filter((x) => x.id && x.src).slice(0, 200);
        }
        if (Array.isArray(body.artboard)) {
          board.artboard = body.artboard.map(cleanArt).filter((x) => x.id && x.src).slice(0, 500);
        }
        board = await saveBoard(store, board);
        return json(payload(board));
      }

      if (act === "create" && post) {
        const clean = cleanPost(post);
        const existing = board.posts.find((p) => String(p.id) === String(clean.id));
        if (!existing) {
          board.posts.unshift(clean);
          if (board.posts.length > 300) board.posts.pop();
        }
        board = await saveBoard(store, board);
        return json(payload(board));
      }

      if (act === "update" && post && post.id) {
        const idx = board.posts.findIndex((p) => String(p.id) === String(post.id));
        const clean = cleanPost(post);
        if (idx >= 0) {
          board.posts[idx] = clean;
        } else {
          board.posts.unshift(clean);
          if (board.posts.length > 300) board.posts.pop();
        }
        board = await saveBoard(store, board);
        return json(payload(board));
      }

      if (act === "delete" && postId) {
        board.posts = board.posts.filter((p) => String(p.id) !== String(postId));
        board = await saveBoard(store, board);
        return json(payload(board));
      }

      if (act === "libAdd" && Array.isArray(body.items)) {
        const cleaned = body.items.map(cleanLib).filter((x) => x.id && x.src);
        const have = new Set(board.library.map((x) => String(x.id)));
        for (const it of cleaned) {
          if (!have.has(it.id)) {
            board.library.unshift(it);
            have.add(it.id);
          }
        }
        if (board.library.length > 200) board.library = board.library.slice(0, 200);
        board = await saveBoard(store, board);
        return json(payload(board));
      }

      if (act === "libDelete" && Array.isArray(body.ids)) {
        const set = new Set(body.ids.map(String));
        board.library = board.library.filter((x) => !set.has(String(x.id)));
        board = await saveBoard(store, board);
        return json(payload(board));
      }

      if (act === "artAdd" && Array.isArray(body.items)) {
        const cleaned = body.items.map(cleanArt).filter((x) => x.id && x.src);
        const have = new Set(board.artboard.map((x) => String(x.id)));
        for (const it of cleaned) {
          if (!have.has(it.id)) {
            board.artboard.unshift(it);
            have.add(it.id);
          }
        }
        if (board.artboard.length > 500) board.artboard = board.artboard.slice(0, 500);
        board = await saveBoard(store, board);
        return json(payload(board));
      }

      if (act === "artUpdate" && body.item && body.item.id) {
        const clean = cleanArt(body.item);
        const idx = board.artboard.findIndex((x) => String(x.id) === String(clean.id));
        if (idx >= 0) {
          board.artboard[idx] = clean;
        } else {
          board.artboard.unshift(clean);
          if (board.artboard.length > 500) board.artboard.pop();
        }
        board = await saveBoard(store, board);
        return json(payload(board));
      }

      if (act === "artDelete" && Array.isArray(body.ids)) {
        const set = new Set(body.ids.map(String));
        board.artboard = board.artboard.filter((x) => !set.has(String(x.id)));
        board = await saveBoard(store, board);
        return json(payload(board));
      }

      return json({ error: "Unknown action" }, 400);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("Handler error:", err);
    return json({ error: err.message }, 500);
  }
}
