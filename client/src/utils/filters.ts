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
// Simplified approach: applies a global hue rotation based on user-adjusted values
// This is a heuristic that allows users to compensate for perceived hue shifts
// Note: This is not a scientifically rigorous LMS transformation, but rather
// a user-customizable filter that may help with color differentiation
export function applyCustomAdaptiveFilter(hex: string, adjustment: RGBAdjustment): string {
  const { r, g, b } = hexToRgb(hex);
  
  // Convert the full color to HSL
  const hsl = rgbToHsl(r, g, b);
  
  // Avoid processing achromatic colors (grays) 
  if (hsl.s < 0.01) {
    return hex;
  }
  
  // Calculate average hue offset from default RGB hues
  // Default: Red=0°, Green=120°, Blue=240°
  // Adjustment represents user's preferred hue for each primary
  const avgOffset = (
    (adjustment.redHue - 0) +
    (adjustment.greenHue - 120) +
    (adjustment.blueHue - 240)
  ) / 3;
  
  // Apply global hue shift based on average offset
  // This provides a consistent transformation across all colors
  const newHue = (hsl.h + avgOffset + 360) % 360;
  
  // Convert back to RGB
  const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
  
  return rgbToHex(
    Math.round(Math.max(0, Math.min(255, newRgb.r))),
    Math.round(Math.max(0, Math.min(255, newRgb.g))),
    Math.round(Math.max(0, Math.min(255, newRgb.b)))
  );
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
