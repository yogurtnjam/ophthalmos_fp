import { z } from "zod";

// Questionnaire Schema
export const questionnaireSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(1).max(120),
  cvdType: z.enum(["none", "protanopia", "deuteranopia", "tritanopia", "unknown"]),
  screenTimePerWeek: z.number().min(0).max(168), // hours per week
});

export type Questionnaire = z.infer<typeof questionnaireSchema>;

// Detailed Cone Metrics Schema (per cone type)
export const coneMetricsSchema = z.object({
  threshold: z.number(), // Contrast threshold percentage (0-100)
  stdError: z.number(), // Standard error percentage
  trials: z.number(), // Number of trials completed
  avgTime: z.number(), // Average response time in seconds
  logCS: z.number(), // Logarithm of contrast sensitivity
  score: z.number(), // Normalized score (0-200)
  category: z.enum(["Normal", "Possible", "Deficient"]), // Classification
});

export type ConeMetrics = z.infer<typeof coneMetricsSchema>;

// Cone Test Result Schema
export const coneTestResultSchema = z.object({
  L: coneMetricsSchema, // L-cone (red) detailed metrics
  M: coneMetricsSchema, // M-cone (green) detailed metrics
  S: coneMetricsSchema, // S-cone (blue) detailed metrics
  detectedType: z.enum(["protan", "deutan", "tritan", "normal"]),
});

export type ConeTestResult = z.infer<typeof coneTestResultSchema>;

// RGB Hue Adjustments Schema
export const rgbAdjustmentSchema = z.object({
  redHue: z.number().min(0).max(360),
  greenHue: z.number().min(0).max(360),
  blueHue: z.number().min(0).max(360),
});

export type RGBAdjustment = z.infer<typeof rgbAdjustmentSchema>;

// Task Performance Schema
export const taskPerformanceSchema = z.object({
  taskId: z.string(), // "tile-1", "tile-2", "color-match", "card-match"
  filterType: z.enum(["custom", "protanopia", "deuteranopia", "tritanopia", "grayscale"]),
  timeMs: z.number(),
  swipes: z.number(),
  clicks: z.number(),
  correct: z.boolean(),
  timestamp: z.string(),
});

export type TaskPerformance = z.infer<typeof taskPerformanceSchema>;

// Complete Session Data Schema
export const sessionDataSchema = z.object({
  questionnaire: questionnaireSchema,
  coneTestResult: coneTestResultSchema,
  rgbAdjustment: rgbAdjustmentSchema,
  taskPerformances: z.array(taskPerformanceSchema),
  createdAt: z.string(),
});

export type SessionData = z.infer<typeof sessionDataSchema>;

// OS Preset Filter Types
export type OSPresetFilter = "protanopia" | "deuteranopia" | "tritanopia" | "grayscale";

// Filter application function types
export interface FilterConfig {
  type: "custom" | OSPresetFilter;
  rgbAdjustment?: RGBAdjustment;
}
