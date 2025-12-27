export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  metadata?: MessageMetadata;
  created_at: string;
}

export interface MessageMetadata {
  agents_used?: string[];
  requires_human_review?: boolean;
  safety_flags?: string[];
  confidence_score?: number;
}

export interface Conversation {
  id: number;
  user_id: number;
  child_id: number;
  title?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface ConversationCreate {
  child_id: number;
  title?: string;
}

export interface MessageCreate {
  content: string;
}

export interface ConversationListItem {
  id: number;
  child_id: number;
  child_name?: string;
  title?: string;
  last_message?: string;
  last_message_at?: string;
  message_count?: number;
  created_at: string;
}
