import api from './api';

// Types for conversations
export interface Message {
    id: number;
    conversation_id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface Conversation {
    id: number;
    child_id: number;
    thread_id: string;
    title: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    messages?: Message[];
}

export interface ConversationCreate {
    child_id: number;
    initial_message?: string;
}

export interface SendMessageRequest {
    content: string;
}

export interface SendMessageResponse {
    message_id: number;
    content: string;
    requires_human_review?: boolean;
    safety_flags?: string[];
    metadata?: Record<string, unknown>;
    new_title?: string;  // Auto-generated title after first exchange
}

// Conversations API functions
export const conversationsApi = {
    /**
     * Get all conversations, optionally filtered by child
     */
    getAll: async (childId?: number): Promise<Conversation[]> => {
        const params = childId ? { child_id: childId } : {};
        const response = await api.get<Conversation[]>('/conversations', { params });
        return response.data;
    },

    /**
     * Get a single conversation with messages
     */
    getById: async (id: number): Promise<Conversation> => {
        const response = await api.get<Conversation>(`/conversations/${id}`);
        return response.data;
    },

    /**
     * Create a new conversation
     */
    create: async (data: ConversationCreate): Promise<Conversation> => {
        const response = await api.post<Conversation>('/conversations', data);
        return response.data;
    },

    /**
     * Send a message and get AI response
     */
    sendMessage: async (conversationId: number, content: string): Promise<SendMessageResponse> => {
        const response = await api.post<SendMessageResponse>(
            `/conversations/${conversationId}/messages`,
            { content }
        );
        return response.data;
    },

    /**
     * Delete a conversation
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/conversations/${id}`);
    },
};

export default conversationsApi;
