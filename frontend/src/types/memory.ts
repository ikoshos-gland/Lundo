export interface Pattern {
  id: number;
  child_id: number;
  pattern_type: string;
  description: string;
  frequency: 'rare' | 'occasional' | 'frequent' | 'very_frequent';
  first_observed: string;
  last_observed: string;
  context?: string;
  triggers?: string[];
  interventions?: string[];
}

export interface TimelineEvent {
  id: number;
  child_id: number;
  event_type: string;
  title: string;
  description: string;
  occurred_at: string;
  category?: 'developmental' | 'behavioral' | 'social' | 'emotional' | 'academic';
  metadata?: Record<string, any>;
}

export interface Intervention {
  id: number;
  child_id: number;
  strategy: string;
  description: string;
  effectiveness: 'not_tried' | 'ineffective' | 'somewhat_effective' | 'very_effective';
  context?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MemorySummary {
  child_id: number;
  total_conversations: number;
  key_patterns: Pattern[];
  recent_events: TimelineEvent[];
  successful_interventions: Intervention[];
}

export interface SearchResult {
  type: 'pattern' | 'event' | 'intervention' | 'conversation';
  id: number;
  title: string;
  description: string;
  relevance_score: number;
  date: string;
}
