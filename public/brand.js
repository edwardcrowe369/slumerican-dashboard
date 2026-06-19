/* =================================================================
   BRAND CONFIG  —  this is the ONLY file you edit per brand.
   Currently configured for: SLUMERICAN
   To spin up a new brand: copy brand.template.js over this file,
   fill it in, set BRAND_SLUG in Netlify, deploy.
   ================================================================= */
window.BRAND = {
  // --- identity ---
  slug: "slumerican",                       // must match the BRAND_SLUG env var in Netlify
  name: "SLUMERICAN",                       // shown as the wordmark (used if no logo set)
  subhead: "Content Dashboard",
  title: "Slumerican — Content Dashboard",  // browser tab title

  // --- logo ---
  // Leave null to show the NAME as a text wordmark in the brand font.
  // To use an image, paste a base64 data URL: "data:image/png;base64,...."
  logo: null,

  // --- typography ---
  // A Google Fonts stylesheet URL for the wordmark font, and the family name.
  fontUrl: "https://fonts.googleapis.com/css2?family=Anton&display=swap",
  wordmarkFont: "'Anton','Georgia',serif",

  // --- color palette (dark UI) ---
  colors: {
    bg:         "#0d0d0e",   // page background
    panel:      "#17171a",   // cards / panels
    panelAlt:   "#202024",   // hover / inset
    line:       "rgba(255,255,255,.10)",
    text:       "#ffffff",
    dim:        "#e6e4e1",
    faint:      "#aba8a3",
    primary:    "#c2410c",   // main accent (buttons, active states)
    primaryDim: "#7c2d12",   // darker accent (borders)
    signature:  "#9aa7b2",   // secondary accent
    green:      "#6f8f5f",   // approved
    red:        "#b91c1c",   // denied / delete
    blue:       "#6f93b8"    // posted
  },

  // --- atmosphere ---
  splatter: false,   // Murder Cigars used a blood-splatter overlay; off for Slumerican

  // --- optional starter content (leave empty for a clean board) ---
  seedLibrary: [],
  seedPosts: []
};
