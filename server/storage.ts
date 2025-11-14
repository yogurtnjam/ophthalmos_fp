import { SessionData, TaskPerformance, ConeTestResult, RGBAdjustment } from "../shared/schema";

export interface IStorage {
  // Session management
  saveSession(sessionData: SessionData): Promise<string>; // returns session ID
  getSession(sessionId: string): Promise<SessionData | null>;
  getAllSessions(): Promise<SessionData[]>;
  
  // Session updates
  updateConeTestResult(sessionId: string, result: ConeTestResult): Promise<void>;
  updateRGBAdjustment(sessionId: string, adjustment: RGBAdjustment): Promise<void>;
  
  // Task performance
  saveTaskPerformance(sessionId: string, performance: TaskPerformance): Promise<void>;
  getTaskPerformances(sessionId: string): Promise<TaskPerformance[]>;
  
  // Clear data
  clearAllData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, SessionData> = new Map();

  async saveSession(sessionData: SessionData): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.sessions.set(sessionId, sessionData);
    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getAllSessions(): Promise<SessionData[]> {
    return Array.from(this.sessions.values());
  }

  async updateConeTestResult(sessionId: string, result: ConeTestResult): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.coneTestResult = result;
      this.sessions.set(sessionId, session);
    }
  }

  async updateRGBAdjustment(sessionId: string, adjustment: RGBAdjustment): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.rgbAdjustment = adjustment;
      this.sessions.set(sessionId, session);
    }
  }

  async saveTaskPerformance(sessionId: string, performance: TaskPerformance): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.taskPerformances.push(performance);
      this.sessions.set(sessionId, session);
    }
  }

  async getTaskPerformances(sessionId: string): Promise<TaskPerformance[]> {
    const session = this.sessions.get(sessionId);
    return session?.taskPerformances || [];
  }

  async clearAllData(): Promise<void> {
    this.sessions.clear();
  }
}

export const storage = new MemStorage();
