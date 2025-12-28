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

// Streaming event types
export interface StreamTokenEvent {
    content: string;
}

export interface StreamDoneEvent {
    message_id: number;
    requires_human_review: boolean;
    safety_flags: string[];
    new_title?: string;
}

export interface StreamStatusEvent {
    status: string;
}

export interface StreamErrorEvent {
    error: string;
}

// Exploration phase types
export type ExplorationPhase = 'not_started' | 'exploration_questions' | 'deep_questions' | 'completed';

export interface QuestionAnswer {
    question: string;
    answer?: string;
    question_type: 'exploration' | 'deep';
    question_number: number;
    asked_at?: string;
    answered_at?: string;
}

export interface ExplorationStatus {
    phase: ExplorationPhase;
    current_question_number: number;
    total_questions: number;
    current_question?: string;
    exploration_qa: QuestionAnswer[];
    deep_qa: QuestionAnswer[];
    initial_concern?: string;
    topic_id?: string;
}

export interface ExplorationQuestionEvent {
    question: string;
    question_number: number;
    question_type: 'exploration' | 'deep';
    phase: ExplorationPhase;
    is_last_question: boolean;
    topic_id: string;
}

export interface ExplorationCompleteEvent {
    exploration_qa: QuestionAnswer[];
    deep_qa: QuestionAnswer[];
    initial_concern: string;
    topic_id: string;
}

export type StreamEvent =
    | { type: 'token'; data: StreamTokenEvent }
    | { type: 'done'; data: StreamDoneEvent }
    | { type: 'status'; data: StreamStatusEvent }
    | { type: 'error'; data: StreamErrorEvent }
    | { type: 'exploration_question'; data: ExplorationQuestionEvent }
    | { type: 'exploration_complete'; data: ExplorationCompleteEvent };

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

    /**
     * Send a message and stream the AI response using SSE
     */
    sendMessageStream: async function* (
        conversationId: number,
        content: string
    ): AsyncGenerator<StreamEvent, void, unknown> {
        const token = localStorage.getItem('access_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

        const response = await fetch(
            `${baseUrl}/conversations/${conversationId}/messages/stream`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE events from buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                let eventType = '';
                let eventData = '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        eventType = line.slice(7).trim();
                    } else if (line.startsWith('data: ')) {
                        eventData = line.slice(6);
                    } else if (line === '' && eventType && eventData) {
                        // End of event
                        try {
                            const data = JSON.parse(eventData);
                            yield { type: eventType, data } as StreamEvent;
                        } catch (e) {
                            console.error('Failed to parse SSE data:', e);
                        }
                        eventType = '';
                        eventData = '';
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    },

    /**
     * Get exploration phase status for a conversation
     */
    getExplorationStatus: async (conversationId: number): Promise<ExplorationStatus> => {
        const response = await api.get<ExplorationStatus>(
            `/conversations/${conversationId}/exploration/status`
        );
        return response.data;
    },

    /**
     * Submit answer to exploration question and stream next question
     */
    submitExplorationAnswer: async function* (
        conversationId: number,
        answer: string
    ): AsyncGenerator<StreamEvent, void, unknown> {
        const token = localStorage.getItem('access_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

        const response = await fetch(
            `${baseUrl}/conversations/${conversationId}/exploration/answer`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ answer }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE events from buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let eventType = '';
                let eventData = '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        eventType = line.slice(7).trim();
                    } else if (line.startsWith('data: ')) {
                        eventData = line.slice(6);
                    } else if (line === '' && eventType && eventData) {
                        try {
                            const data = JSON.parse(eventData);
                            yield { type: eventType, data } as StreamEvent;
                        } catch (e) {
                            console.error('Failed to parse SSE data:', e);
                        }
                        eventType = '';
                        eventData = '';
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    },
};

export default conversationsApi;
