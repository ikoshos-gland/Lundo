import { MemorySaver } from '@langchain/langgraph';
import { InMemoryStore } from '@langchain/langgraph';
import { SessionData } from '../agents/base/types.js';

class SessionManager {
  private memorySaver: MemorySaver;
  private inMemoryStore: InMemoryStore;
  private sessions: Map<string, SessionData>;

  constructor() {
    this.memorySaver = new MemorySaver();
    this.inMemoryStore = new InMemoryStore();
    this.sessions = new Map();
  }

  getSession(sessionId: string): SessionData {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        createdAt: new Date(),
        messages: [],
        activeAgent: null,
        enabledAgents: ['reality-checker'] // Reality Checker is always on
      });
    }
    return this.sessions.get(sessionId)!;
  }

  updateSession(sessionId: string, updates: Partial<SessionData>): SessionData {
    const session = this.getSession(sessionId);
    const updated = { ...session, ...updates };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getMemorySaver(): MemorySaver {
    return this.memorySaver;
  }

  getInMemoryStore(): InMemoryStore {
    return this.inMemoryStore;
  }
}

export const sessionManager = new SessionManager();
