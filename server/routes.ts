import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { recommendManualParams } from './model';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const RUNS_FILE = path.join(DATA_DIR, 'runs.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RUNS_FILE)) fs.writeFileSync(RUNS_FILE, '[]', 'utf8');

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.post('/api/log-run', (req, res) => {
    try {
      const body = req.body || {};
      const now = new Date().toISOString();
      const withTs = { ...body, serverTimestamp: now };
      const arr = JSON.parse(fs.readFileSync(RUNS_FILE, 'utf8'));
      arr.push(withTs);
      fs.writeFileSync(RUNS_FILE, JSON.stringify(arr, null, 2), 'utf8');
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false });
    }
  });

  app.post('/api/recommend', (req, res) => {
    try {
      const { cones, history } = req.body || {};
      if (!cones) return res.status(400).json({ error: 'missing cones' });
      const manual = recommendManualParams(cones, history || []);
      res.json({ manual });
    } catch (e) {
      res.status(500).json({ error: 'failed' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
