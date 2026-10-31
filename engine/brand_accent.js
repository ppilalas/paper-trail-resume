#!/usr/bin/env node
/**
 * Brand accent resolver for the editorial resume system.
 *
 * Takes the candidate brand colors found for a target company and returns a
 * legible accent set for the resume. Pure computation - it does no network
 * access. Finding the colors is a separate research step documented in
 * README.md; this file only decides whether a color can be used and what it
 * has to become in order to be used.
 *
 * Rules it enforces:
 *   1. The accent must reach at least 4.5:1 contrast against the paper, so
 *      small bold text set in the accent (company names, the eyebrow) stays
 *      readable and extracts cleanly.
 *   2. The accent must stay visually distinct from the ink, or it stops
 *      reading as an accent at all. A near-black navy brand color is rejected
 *      for that reason even though it passes contrast.
 *   3. Adjustments move lightness only. Hue and saturation are preserved so
 *      the color still reads as the company's.
 *
 * Usage:
 *   node brand_accent.js "#FF0079" "#001A3D" "#8DEDC7"
 *   node brand_accent.js --paper "#fbfaf6" --ink "#17233a" "#FF0079"
 */

const MIN_PAPER_CONTRAST = 4.5;
const MIN_INK_DISTINCTION = 1.35; // contrast between accent and ink
const DEFAULT_PAPER = '#fbfaf6';
const DEFAULT_INK = '#17233a';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function hexToRgb(hex) {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Not a hex color: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function hslToRgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(((h % 360) + 360) % 360 / 60);
  const table = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]];
  return table[seg].map((v) => (v + m) * 255);
}

const hslToHex = (hsl) => rgbToHex(hslToRgb(hsl));

/**
 * Darken (or lighten) a color along lightness only until it meets the paper
 * contrast floor. Returns null when no lightness value works, which happens
 * for colors that are essentially the paper or essentially the ink.
 */
function fitToPaper(hex, paper, minContrast) {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  if (contrast(hex, paper) >= minContrast) return { hex, adjusted: false, lightness: l };
  for (let step = 1; step <= 100; step += 1) {
    const candidate = hslToHex([h, s, clamp(l - step / 100, 0, 1)]);
    if (contrast(candidate, paper) >= minContrast) {
      return { hex: candidate, adjusted: true, lightness: clamp(l - step / 100, 0, 1) };
    }
  }
  return null;
}

/**
 * Resolve an accent set from candidate brand colors, in preference order.
 * Returns the first candidate that can be made legible and stays distinct
 * from the ink, plus the derived soft tint and a neutral panel fill.
 */
function resolveBrandAccent(candidates, options = {}) {
  const paper = options.paper || DEFAULT_PAPER;
  const ink = options.ink || DEFAULT_INK;
  const minPaper = options.minPaperContrast || MIN_PAPER_CONTRAST;
  const minInk = options.minInkDistinction || MIN_INK_DISTINCTION;

  const rejected = [];
  for (const raw of candidates) {
    const fitted = fitToPaper(raw, paper, minPaper);
    if (!fitted) {
      rejected.push({ color: raw, reason: 'no lightness value reaches the paper contrast floor' });
      continue;
    }
    const inkContrast = contrast(fitted.hex, ink);
    if (inkContrast < minInk) {
      rejected.push({
        color: raw,
        reason: `too close to the ink (${inkContrast.toFixed(2)}:1, needs ${minInk}:1) - it would stop reading as an accent`,
      });
      continue;
    }
    const [h, s] = rgbToHsl(hexToRgb(fitted.hex));
    return {
      source: raw,
      accent: fitted.hex,
      adjusted: fitted.adjusted,
      accentSoft: hslToHex([h, Math.min(s, 0.55), 0.9]),
      panelFill: options.panelFill || '#efedea',
      paperContrast: +contrast(fitted.hex, paper).toFixed(2),
      inkContrast: +inkContrast.toFixed(2),
      rejected,
    };
  }
  return { accent: null, rejected };
}

module.exports = { resolveBrandAccent, contrast, fitToPaper, rgbToHsl, hslToHex };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opts = {};
  const colors = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--paper') { opts.paper = argv[++i]; continue; }
    if (argv[i] === '--ink') { opts.ink = argv[++i]; continue; }
    colors.push(argv[i]);
  }
  if (!colors.length) {
    console.error('Usage: node brand_accent.js [--paper HEX] [--ink HEX] "#BRAND1" "#BRAND2" ...');
    process.exit(1);
  }
  const result = resolveBrandAccent(colors, opts);
  console.log(JSON.stringify(result, null, 2));
  if (!result.accent) process.exit(2);
}
