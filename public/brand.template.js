/* =================================================================
   BRAND CONFIG TEMPLATE
   1. Copy this file's contents into brand.js
   2. Fill every field below
   3. In Netlify, set env var  BRAND_SLUG = <your slug>
   4. Connect this brand's accounts in Zernio, set ZERNIO_API_KEY
   5. Deploy
   ================================================================= */
window.BRAND = {
  // --- identity ---
  slug: "yourbrand",                          // lowercase, no spaces. MUST equal the Netlify BRAND_SLUG env var.
  name: "YOUR BRAND",                         // wordmark text (used when logo is null)
  subhead: "Content Dashboard",
  title: "Your Brand — Content Dashboard",    // browser tab title

  // --- logo ---
  logo: null,                                 // null = text wordmark, or "data:image/png;base64,...." for an image

  // --- typography ---
  fontUrl: "https://fonts.googleapis.com/css2?family=Oswald:wght@600&display=swap",
  wordmarkFont: "'Oswald','Georgia',serif",

  // --- color palette ---
  colors: {
    bg:         "#0a0a0a",
    panel:      "#151515",
    panelAlt:   "#1e1e1e",
    line:       "rgba(255,255,255,.10)",
    text:       "#ffffff",
    dim:        "#e8e8e8",
    faint:      "#b0b0b0",
    primary:    "#3b82f6",   // your main accent
    primaryDim: "#1e3a8a",
    signature:  "#c9a06a",
    green:      "#6f9a5f",
    red:        "#c0392b",
    blue:       "#6f93b8"
  },

  // --- atmosphere ---
  splatter: false,

  // --- optional starter content ---
  seedLibrary: [],
  seedPosts: []
};
