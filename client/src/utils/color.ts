export const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

export function hexToRgb(hex: string) {
  const m = hex.replace('#', '');
  const v = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

export const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

const s2l = (c: number) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }) =>
  0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b);

export function contrastRatio(a: string, b: string) {
  const L1 = relativeLuminance(hexToRgb(a)),
    L2 = relativeLuminance(hexToRgb(b));
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h, s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

export function hslToRgb(h: number, s: number, l: number) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
      p = 2 * l - q;
    const f = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    r = f(p, q, h + 1 / 3);
    g = f(p, q, h);
    b = f(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function applyManualAdjust(
  hex: string,
  { hShift, sMult, lMult, extraContrast }: { hShift: number; sMult: number; lMult: number; extraContrast: number },
  bgHex: string
) {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  let h = (hsl.h + hShift + 360) % 360,
    s = clamp(hsl.s * sMult, 0, 1),
    l = clamp(hsl.l * lMult, 0, 1);
  let rgb = hslToRgb(h, s, l);
  let out = rgbToHex(rgb.r, rgb.g, rgb.b);
  if (extraContrast && bgHex) {
    let ratio = contrastRatio(out, bgHex),
      tries = 0;
    const target = 4.5;
    while (ratio < target && tries < 20) {
      const bgL = relativeLuminance(hexToRgb(bgHex));
      const step = bgL > 0.5 ? -10 : 10;
      const cur = hexToRgb(out);
      out = rgbToHex(
        Math.max(0, Math.min(255, cur.r + step)),
        Math.max(0, Math.min(255, cur.g + step)),
        Math.max(0, Math.min(255, cur.b + step))
      );
      ratio = contrastRatio(out, bgHex);
      tries++;
    }
  }
  return out;
}

export function adaptFromCones(hex: string, cones: { L: number; M: number; S: number }) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const L = clamp(cones.L, 0, 1),
    M = clamp(cones.M, 0, 1),
    S = clamp(cones.S, 0, 1);
  let hShift = 0;
  if (L < 0.5) hShift += 8;
  if (M < 0.7) hShift -= 6;
  if (S < 0.6) hShift += 4;
  const rgb2 = hslToRgb((h + hShift + 360) % 360, s, l);
  const rMul = L < 0.8 ? 1.1 + (0.8 - L) : 1,
    gMul = M < 0.8 ? 1.1 + (0.8 - M) : 1,
    bMul = S < 0.8 ? 1.1 + (0.8 - S) : 1;
  return rgbToHex(
    Math.round(clamp(rgb2.r * rMul, 0, 255)),
    Math.round(clamp(rgb2.g * gMul, 0, 255)),
    Math.round(clamp(rgb2.b * bMul, 0, 255))
  );
}
