import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from './storage';
import { sessionDataSchema, taskPerformanceSchema } from '../shared/schema';

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Save complete session data
  app.post('/api/sessions', async (req, res) => {
    try {
      const validatedData = sessionDataSchema.parse(req.body);
      const sessionId = await storage.saveSession(validatedData);
      res.json({ sessionId, ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Invalid session data' });
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

  // Save task performance
  app.post('/api/sessions/:sessionId/tasks', async (req, res) => {
    try {
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
