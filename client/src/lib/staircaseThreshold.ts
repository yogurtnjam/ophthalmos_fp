/**
 * Staircase Threshold Calculator
 * Detects reversal points and computes threshold from adaptive staircase data
 * Optimized for Cone Contrast Tests (CCT) but works for any staircase
 */

export interface ReversalPoint {
  index: number;
  contrast: number;
  directionChange: [number, number];
}

export interface ThresholdResult {
  totalReversalsFound: number;
  reversalPoints: ReversalPoint[];
  usedForThreshold: number[];
  thresholdMean: number;
  thresholdStd: number;
}

export interface ThresholdError {
  error: string;
}

/**
 * Identify reversals: points where the contrast direction changes
 */
function findReversals(contrasts: number[]): ReversalPoint[] {
  if (contrasts.length < 3) {
    return [];
  }

  const reversals: ReversalPoint[] = [];
  
  // Calculate differences and directions
  const diffs: number[] = [];
  for (let i = 1; i < contrasts.length; i++) {
    diffs.push(contrasts[i] - contrasts[i - 1]);
  }
  
  const dirs = diffs.map(d => Math.sign(d)); // +1 up, -1 down, 0 same
  
  // Initialize prev_dir to the first non-zero direction
  let prevDir: number | null = null;
  for (const d of dirs) {
    if (d !== 0) {
      prevDir = d;
      break;
    }
  }
  
  // Scan through remaining differences to find reversals
  for (let i = 1; i < dirs.length; i++) {
    const curr = dirs[i];
    if (curr === 0) {
      continue; // ignore plateaus
    }
    
    if (curr !== prevDir && prevDir !== null) {
      // Reversal at contrasts[i]
      const revIndex = i;
      reversals.push({
        index: revIndex,
        contrast: contrasts[revIndex],
        directionChange: [prevDir, curr]
      });
    }
    prevDir = curr;
  }
  
  return reversals;
}

/**
 * Calculate threshold from reversal points
 * @param contrasts - Array of contrast values from the staircase
 * @param lastN - How many reversals to average (typically 6-12)
 * @param discardFirst - How many early reversals to discard (common: 1 or 2)
 */
export function thresholdFromReversals(
  contrasts: number[],
  lastN: number = 6,
  discardFirst: number = 1
): ThresholdResult | ThresholdError {
  const reversals = findReversals(contrasts);
  
  if (reversals.length === 0) {
    return { error: "No reversals detected. Check your data." };
  }
  
  let revValues = reversals.map(r => r.contrast);
  
  // Drop early unstable reversals
  if (discardFirst > 0) {
    revValues = revValues.slice(discardFirst);
  }
  
  // Take last N
  const used = revValues.length >= 1 ? revValues.slice(-lastN) : [];
  
  if (used.length === 0) {
    return { error: "Not enough reversals to compute threshold." };
  }
  
  const mean = used.reduce((sum, val) => sum + val, 0) / used.length;
  
  // Calculate standard deviation
  let std = 0;
  if (used.length > 1) {
    const variance = used.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (used.length - 1);
    std = Math.sqrt(variance);
  }
  
  return {
    totalReversalsFound: reversals.length,
    reversalPoints: reversals,
    usedForThreshold: used,
    thresholdMean: mean,
    thresholdStd: std
  };
}

/**
 * Calculate threshold from fixed-level test data
 * Converts pass/fail data at fixed contrast levels to threshold estimate
 * @param contrastLevels - Array of contrast levels tested (e.g., [1, 5, 10, 25, 50, 100])
 * @param responses - Array of boolean responses (true = correct, false = incorrect)
 */
export function thresholdFromFixedLevels(
  contrastLevels: number[],
  responses: boolean[]
): number {
  if (contrastLevels.length !== responses.length) {
    throw new Error("Contrast levels and responses must have same length");
  }
  
  // Find the transition point between incorrect and correct responses
  // Threshold is estimated as the geometric mean between highest incorrect and lowest correct
  
  let highestIncorrect = 0;
  let lowestCorrect = 100;
  
  for (let i = 0; i < contrastLevels.length; i++) {
    if (responses[i]) {
      // Correct response
      if (contrastLevels[i] < lowestCorrect) {
        lowestCorrect = contrastLevels[i];
      }
    } else {
      // Incorrect response
      if (contrastLevels[i] > highestIncorrect) {
        highestIncorrect = contrastLevels[i];
      }
    }
  }
  
  // If all correct, threshold is below the lowest level
  if (highestIncorrect === 0) {
    return contrastLevels[0] / 2;
  }
  
  // If all incorrect, threshold is above the highest level
  if (lowestCorrect === 100) {
    return 100;
  }
  
  // Geometric mean between highest incorrect and lowest correct
  return Math.sqrt(highestIncorrect * lowestCorrect);
}
