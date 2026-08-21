// textures.js — Organic brick & wood textures as inline SVG data-URIs.
// No external assets: everything is generated so it works offline and in build.
// Colors are baked in to match the design tokens in index.css.

const enc = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* ── WOOD (madera) ──────────────────────────────────────────────
   Horizontal planks with soft grain streaks. Warm walnut tone.      */
const woodSvg = `
<svg xmlns='http://www.w3.org/2000/svg' width='260' height='160' viewBox='0 0 260 160'>
  <defs>
    <filter id='grain'>
      <feTurbulence type='fractalNoise' baseFrequency='0.9 0.012' numOctaves='2' seed='11' result='n'/>
      <feColorMatrix in='n' type='matrix' values='0 0 0 0 0.30  0 0 0 0 0.18  0 0 0 0 0.08  0 0 0 0.5 0'/>
    </filter>
  </defs>
  <rect width='260' height='160' fill='#7a4e2d'/>
  <rect width='260' height='160' filter='url(#grain)' opacity='0.35'/>
  <g stroke='#5a3719' stroke-width='2' opacity='0.55'>
    <line x1='0' y1='40' x2='260' y2='40'/>
    <line x1='0' y1='80' x2='260' y2='80'/>
    <line x1='0' y1='120' x2='260' y2='120'/>
  </g>
  <g stroke='#8f6239' stroke-width='1' opacity='0.5'>
    <line x1='0' y1='41' x2='260' y2='41'/>
    <line x1='0' y1='81' x2='260' y2='81'/>
    <line x1='0' y1='121' x2='260' y2='121'/>
  </g>
</svg>`;

/* ── BRICK (ladrillo) ───────────────────────────────────────────
   Running-bond terracotta wall with mortar gaps, seamless tile.     */
const brickSvg = `
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='84' viewBox='0 0 120 84'>
  <rect width='120' height='84' fill='#8a3620'/>
  <g fill='#b14a2e'>
    <rect x='2' y='2' width='56' height='24' rx='2'/>
    <rect x='62' y='2' width='56' height='24' rx='2'/>
    <rect x='-28' y='30' width='56' height='24' rx='2'/>
    <rect x='32' y='30' width='56' height='24' rx='2'/>
    <rect x='92' y='30' width='56' height='24' rx='2'/>
    <rect x='2' y='58' width='56' height='24' rx='2'/>
    <rect x='62' y='58' width='56' height='24' rx='2'/>
  </g>
  <g fill='#c1613f' opacity='0.6'>
    <rect x='62' y='2' width='56' height='7' rx='2'/>
    <rect x='32' y='30' width='56' height='7' rx='2'/>
    <rect x='2' y='58' width='56' height='7' rx='2'/>
  </g>
</svg>`;

/* ── PAPER (papel amate) — faint organic grain over cream ──────── */
const paperSvg = `
<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'>
  <filter id='p'>
    <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='5' result='n'/>
    <feColorMatrix in='n' type='matrix' values='0 0 0 0 0.42  0 0 0 0 0.28  0 0 0 0 0.15  0 0 0 0.05 0'/>
  </filter>
  <rect width='180' height='180' filter='url(#p)'/>
</svg>`;

export const woodTexture = enc(woodSvg);
export const brickTexture = enc(brickSvg);
export const paperTexture = enc(paperSvg);
