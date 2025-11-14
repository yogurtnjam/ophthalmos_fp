import { SessionData, TaskPerformance } from "../shared/schema";

export interface IStorage {
  // Session management
  saveSession(sessionData: SessionData): Promise<string>; // returns session ID
  getSession(sessionId: string): Promise<SessionData | null>;
  getAllSessions(): Promise<SessionData[]>;
  
  // Task performance
  saveTaskPerformance(sessionId: string, performance: TaskPerformance): Promise<void>;
  getTaskPerformances(sessionId: string): Promise<TaskPerformance[]>;
  
  // Clear data
  clearAllData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, SessionData> = new Map();
  private taskPerformances: Map<string, TaskPerformance[]> = new Map();

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

  async saveTaskPerformance(sessionId: string, performance: TaskPerformance): Promise<void> {
    const existing = this.taskPerformances.get(sessionId) || [];
    existing.push(performance);
    this.taskPerformances.set(sessionId, existing);
  }

  async getTaskPerformances(sessionId: string): Promise<TaskPerformance[]> {
    return this.taskPerformances.get(sessionId) || [];
  }

  async clearAllData(): Promise<void> {
    this.sessions.clear();
    this.taskPerformances.clear();
  }
}

export const storage = new MemStorage();
