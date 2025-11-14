import { z } from "zod";

// Questionnaire Schema
export const questionnaireSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(1).max(120),
  cvdType: z.enum(["none", "protanopia", "deuteranopia", "tritanopia", "unknown"]),
  screenTimePerWeek: z.number().min(0).max(168), // hours per week
});

export type Questionnaire = z.infer<typeof questionnaireSchema>;

// Cone Test Result Schema
export const coneTestResultSchema = z.object({
  L: z.number().min(0).max(1), // L-cone sensitivity (red)
  M: z.number().min(0).max(1), // M-cone sensitivity (green)
  S: z.number().min(0).max(1), // S-cone sensitivity (blue)
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
