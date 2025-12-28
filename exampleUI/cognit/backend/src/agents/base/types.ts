export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface SessionData {
  id: string;
  createdAt: Date;
  messages: Message[];
  activeAgent: string | null;
  enabledAgents: string[];
}

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  status: 'always-on' | 'toggleable' | 'scenario-specific';
  icon: string;
  color: string;
}

export interface ActionItem {
  text: string;
  completed: boolean;
}

export interface ChatContext {
  childAge?: number;
  childName?: string;
  language: 'en' | 'tr';
}
