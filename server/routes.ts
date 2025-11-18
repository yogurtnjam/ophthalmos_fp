import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from './storage';
import { sessionDataSchema, taskPerformanceSchema, questionnaireSchema, coneTestResultSchema, rgbAdjustmentSchema, type SessionData } from '../shared/schema';

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Create new session with questionnaire
  app.post('/api/sessions', async (req, res) => {
    try {
      const validatedQuestionnaire = questionnaireSchema.parse(req.body);
      // Create partial session with defaults
      const sessionData: SessionData = {
        questionnaire: validatedQuestionnaire,
        coneTestResult: { L: 0, M: 0, S: 0, detectedType: 'normal' },
        rgbAdjustment: { redHue: 0, greenHue: 120, blueHue: 240 },
        taskPerformances: [],
        createdAt: new Date().toISOString(),
      };
      const sessionId = await storage.saveSession(sessionData);
      res.json({ sessionId, ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Invalid questionnaire data' });
    }
  });

  // Get session by ID
  app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get all sessions
  app.get('/api/sessions', async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update cone test results for a session
  app.post('/api/sessions/:sessionId/cone-test', async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      const validatedResult = coneTestResultSchema.parse(req.body);
      await storage.updateConeTestResult(req.params.sessionId, validatedResult);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Invalid cone test result data' });
    }
  });

  // Update RGB adjustment for a session
  app.post('/api/sessions/:sessionId/rgb-adjustment', async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      const validatedAdjustment = rgbAdjustmentSchema.parse(req.body);
      await storage.updateRGBAdjustment(req.params.sessionId, validatedAdjustment);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Invalid RGB adjustment data' });
    }
  });

  // Save task performance
  app.post('/api/sessions/:sessionId/tasks', async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      const validatedPerformance = taskPerformanceSchema.parse(req.body);
      await storage.saveTaskPerformance(req.params.sessionId, validatedPerformance);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Invalid task performance data' });
    }
  });

  // Get task performances for a session
  app.get('/api/sessions/:sessionId/tasks', async (req, res) => {
    try {
      const performances = await storage.getTaskPerformances(req.params.sessionId);
      res.json(performances);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Clear all data
  app.delete('/api/sessions', async (req, res) => {
    try {
      await storage.clearAllData();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
