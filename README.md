# White-Label Content Dashboard

A reusable social content dashboard: plan posts, route them through client
approval, and publish to Instagram / Facebook / TikTok / YouTube via Zernio.
Everything brand-specific lives in **one file** (`public/brand.js`), so a new
brand is a config change, not a rebuild.

Currently configured for: **Slumerican**.

---

## Spin up a new brand (≈15 min)

1. **Create a new GitHub repo** and upload this whole folder (or duplicate the repo).
2. **Edit `public/brand.js`** — copy `public/brand.template.js` into it and fill in
   the name, colors, font, and (optionally) a logo. That's the entire visual rebrand.
3. **Create a new Netlify site** from that repo.
4. **Set two environment variables** in Netlify
   (Site settings → Environment variables):
   - `BRAND_SLUG` = the same `slug` you put in `brand.js` (e.g. `slumerican`).
     This isolates each brand's stored posts/library so brands never mix.
   - `ZERNIO_API_KEY` = this brand's Zernio key (starts with `sk_`).
5. **In Zernio**, create a profile for the brand and connect its social accounts.
6. **Deploy** (Netlify builds automatically; env-var changes need a fresh deploy).

That's it. Same code, new brand.

---

## What's brand-specific (all in `brand.js`)

| Field          | What it controls                                        |
|----------------|---------------------------------------------------------|
| `slug`         | Must match `BRAND_SLUG`. Namespaces stored data.        |
| `name`         | Wordmark text (used when `logo` is null)                |
| `subhead`      | Small text under the wordmark                           |
| `title`        | Browser tab title                                       |
| `logo`         | `null` for a text wordmark, or a base64 image data URL  |
| `fontUrl`      | Google Fonts stylesheet URL for the wordmark            |
| `wordmarkFont` | CSS font-family for the wordmark                        |
| `colors`       | Full UI palette (bg, panels, accents, status colors)    |
| `splatter`     | Decorative overlay on/off (was Murder Cigars' blood splatter) |
| `seedLibrary` / `seedPosts` | Optional starter content; leave `[]` for a clean board |

Nothing else needs editing to rebrand.

---

## Environment variables (per Netlify site)

| Variable          | Required | Purpose                                              |
|-------------------|----------|------------------------------------------------------|
| `BRAND_SLUG`      | yes      | Isolates this brand's Blobs storage (`<slug>-board`, `<slug>-posts`) |
| `ZERNIO_API_KEY`  | for publishing | Server-side key for posting to socials         |

---

## File structure

```
public/
  index.html        the dashboard (board, library, approval, publish)
  review.html       client approval page (opened via share links)
  brand.js          <-- THE ONLY FILE YOU EDIT PER BRAND
  brand.template.js blank config to copy when starting a new brand
netlify/functions/
  posts-board.js    real-time shared board (sync across devices)
  posts.js          approval/review records
  publish.js        publishing via Zernio
  media.js          legacy image-serving (unused with Zernio; safe to leave)
  itunes.js         song search for posts
netlify.toml        build config
package.json        deps (@netlify/blobs)
```

---

## Notes

- **Storage isolation:** posts/library are stored in Netlify Blobs under
  `<BRAND_SLUG>-board` and `<BRAND_SLUG>-posts`. Two brands with different slugs
  can never see each other's data, even if deployed from identical code.
- **Migrating the original Murder Cigars site onto this template?** Set
  `BRAND_SLUG=murder` so it keeps reading its existing `murder-board` /
  `murder-posts` data. A different slug would start it empty.
- **`media.js`** isn't needed when publishing through Zernio (Zernio hosts the
  images itself). It's left in place and is harmless.
- **Demo art / default logo** baked into `index.html` are never shown once
  `brand.js` provides its own logo/colors and the seed arrays are empty.
- **YouTube** needs video; image posts only publish to Instagram / Facebook /
  TikTok. Zernio's free tier covers 2 connected accounts with unlimited posts.
