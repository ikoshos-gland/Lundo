// Re-export all types
export type { User, LoginCredentials, RegisterData, AuthTokens, AuthResponse, RefreshTokenRequest } from './auth';
export type { Child, ChildCreate, ChildUpdate } from './child';
export type { Message, MessageMetadata, Conversation, ConversationCreate, MessageCreate, ConversationListItem } from './conversation';
export type { Pattern, TimelineEvent, Intervention, MemorySummary, SearchResult } from './memory';

// Utility function re-exports
export { calculateAge } from './child';

// Common types
export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
