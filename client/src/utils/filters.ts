import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from './color';
import { OSPresetFilter, RGBAdjustment } from '../../../shared/schema';

// Apply OS preset filters (iOS/Android color blindness modes)
export function applyOSPresetFilter(hex: string, filterType: OSPresetFilter): string {
  const { r, g, b } = hexToRgb(hex);

  switch (filterType) {
    case 'protanopia': // Red deficiency
      return rgbToHex(
        Math.round(0.567 * r + 0.433 * g + 0 * b),
        Math.round(0.558 * r + 0.442 * g + 0 * b),
        Math.round(0 * r + 0.242 * g + 0.758 * b)
      );

    case 'deuteranopia': // Green deficiency
      return rgbToHex(
        Math.round(0.625 * r + 0.375 * g + 0 * b),
        Math.round(0.7 * r + 0.3 * g + 0 * b),
        Math.round(0 * r + 0.3 * g + 0.7 * b)
      );

    case 'tritanopia': // Blue deficiency
      return rgbToHex(
        Math.round(0.95 * r + 0.05 * g + 0 * b),
        Math.round(0 * r + 0.433 * g + 0.567 * b),
        Math.round(0 * r + 0.475 * g + 0.525 * b)
      );

    case 'grayscale': // Complete color blindness
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      return rgbToHex(gray, gray, gray);

    default:
      return hex;
  }
}

// Apply custom adaptive filter based on RGB hue adjustments
export function applyCustomAdaptiveFilter(hex: string, adjustment: RGBAdjustment): string {
  const { r, g, b } = hexToRgb(hex);
  
  // Convert to HSL for each channel
  const rHsl = rgbToHsl(r, 0, 0);
  const gHsl = rgbToHsl(0, g, 0);
  const bHsl = rgbToHsl(0, 0, b);

  // Apply hue adjustments
  const newR = hslToRgb((rHsl.h + adjustment.redHue) % 360, rHsl.s, rHsl.l).r;
  const newG = hslToRgb((gHsl.h + adjustment.greenHue) % 360, gHsl.s, gHsl.l).g;
  const newB = hslToRgb((bHsl.h + adjustment.blueHue) % 360, bHsl.s, bHsl.l).b;

  return rgbToHex(Math.round(newR), Math.round(newG), Math.round(newB));
}

// Get filter name for display
export function getFilterDisplayName(filterType: 'custom' | OSPresetFilter): string {
  switch (filterType) {
    case 'custom':
      return 'Custom Adaptive';
    case 'protanopia':
      return 'Protanopia Preset';
    case 'deuteranopia':
      return 'Deuteranopia Preset';
    case 'tritanopia':
      return 'Tritanopia Preset';
    case 'grayscale':
      return 'Grayscale Preset';
    default:
      return filterType;
  }
}

// Determine which OS preset to use based on detected CVD type
export function getRecommendedOSPreset(detectedType: string): OSPresetFilter {
  switch (detectedType.toLowerCase()) {
    case 'protan':
      return 'protanopia';
    case 'deutan':
      return 'deuteranopia';
    case 'tritan':
      return 'tritanopia';
    default:
      return 'grayscale';
  }
}
