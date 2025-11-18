export type ConeSensitivity = {
  l: number;
  m: number;
  s: number;
};

export type DifficultySummary = {
  accuracy: number;
  sliderError: number;
  sliderSwipes: number;
  searchDifficulty: number;
};

export type AdaptiveFilterState = {
  gains: { l: number; m: number; s: number };
  saturationMultiplier: number;
  valueLift: number;
  hueShiftDeg: number;
  problematicRange: [number, number];
  centerHue: number;
};

const RGB_TO_LMS = [
  [0.31399, 0.639513, 0.046497],
  [0.155372, 0.757894, 0.086701],
  [0.017752, 0.109442, 0.872569],
];

const LMS_TO_RGB = [
  [5.47221206, -4.6419601, 0.16963708],
  [-1.1252419, 2.29317094, -0.1678952],
  [0.02980165, -0.19318073, 1.16364789],
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const defaultDifficulty: DifficultySummary = {
  accuracy: 0.65,
  sliderError: 0.35,
  sliderSwipes: 0.4,
  searchDifficulty: 0.5,
};

export function computeAdaptiveFilter(
  sensitivity: ConeSensitivity,
  difficulty: DifficultySummary = defaultDifficulty,
  hyper = { alpha: { l: 0.85, m: 0.8, s: 0.75 }, betaS: 0.45, betaV: 0.35, deltaH: 12, lambda: 0.35, mu: 0.25 }
): AdaptiveFilterState {
  const gains = {
    l: 1 + hyper.alpha.l * (1 - clamp01(sensitivity.l)),
    m: 1 + hyper.alpha.m * (1 - clamp01(sensitivity.m)),
    s: 1 + hyper.alpha.s * (1 - clamp01(sensitivity.s)),
  };

  const difficultyAccuracy = clamp01(1 - difficulty.accuracy);
  const difficultyMatch = clamp01(difficulty.sliderError + hyper.lambda * difficulty.sliderSwipes);
  const difficultySearch = clamp01(difficulty.searchDifficulty + hyper.mu * difficulty.searchDifficulty * 0.5);

  const saturationMultiplier = 1 + hyper.betaS * difficultyMatch;
  const valueLift = hyper.betaV * difficultySearch;
  const hueShiftDeg = hyper.deltaH * difficultyAccuracy;

  return {
    gains,
    saturationMultiplier,
    valueLift,
    hueShiftDeg,
    problematicRange: [330, 30],
    centerHue: 0,
  };
}

const srgbToLinear = (value: number) => {
  const v = value / 255;
  if (v <= 0.04045) return v / 12.92;
  return Math.pow((v + 0.055) / 1.055, 2.4);
};

const linearToSrgb = (value: number) => {
  if (value <= 0.0031308) return value * 12.92;
  return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
};

const multiplyMatrix = (matrix: number[][], vector: number[]): number[] => {
  return matrix.map((row) => row.reduce((sum, entry, index) => sum + entry * vector[index], 0));
};

const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return [h, s, v];
};

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [r + m, g + m, b + m];
};

const parseHex = (hex: string): [number, number, number] | null => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return [r, g, b];
};

const toHex = (r: number, g: number, b: number): string => {
  const component = (value: number) => {
    const clamped = Math.round(clamp01(value) * 255);
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${component(r)}${component(g)}${component(b)}`;
};

const isWithinHueRange = (h: number, range: [number, number]) => {
  const [start, end] = range;
  if (start <= end) {
    return h >= start && h <= end;
  }
  return h >= start || h <= end;
};

export function applyAdaptiveFilter(hex: string, state: AdaptiveFilterState): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const linear = rgb.map(srgbToLinear) as [number, number, number];
  const lms = multiplyMatrix(RGB_TO_LMS, linear);
  const compensated = lms.map((value, index) => {
    if (index === 0) return value * state.gains.l;
    if (index === 1) return value * state.gains.m;
    return value * state.gains.s;
  });
  const compensatedLinear = multiplyMatrix(LMS_TO_RGB, compensated);
  const srgb = compensatedLinear.map(linearToSrgb).map((value) => clamp01(value));
  const [hOriginal, sOriginal, vOriginal] = rgbToHsv(srgb[0], srgb[1], srgb[2]);
  const s = clamp01(sOriginal * state.saturationMultiplier);
  const v = clamp01(vOriginal + state.valueLift * (1 - vOriginal));
  let h = hOriginal;
  if (isWithinHueRange(hOriginal, state.problematicRange)) {
    const direction = hOriginal >= state.centerHue && hOriginal <= state.centerHue + 180 ? 1 : -1;
    h = (hOriginal + direction * state.hueShiftDeg + 360) % 360;
  }
  const [r, g, b] = hsvToRgb(h, s, v);
  return toHex(r, g, b);
}
