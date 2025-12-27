import api from './api';
import { Conversation, ConversationCreate, ConversationListItem, Message, MessageCreate } from '@/types';

export const conversationService = {
  async getAll(childId?: number): Promise<ConversationListItem[]> {
    const params = childId ? { child_id: childId } : {};
    const response = await api.get<ConversationListItem[]>('/conversations', { params });
    return response.data;
  },

  async getById(id: number): Promise<Conversation> {
    const response = await api.get<Conversation>(`/conversations/${id}`);
    return response.data;
  },

  async create(data: ConversationCreate): Promise<Conversation> {
    const response = await api.post<Conversation>('/conversations', data);
    return response.data;
  },

  async sendMessage(conversationId: number, data: MessageCreate): Promise<Message> {
    const response = await api.post<Message>(
      `/conversations/${conversationId}/messages`,
      data
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/conversations/${id}`);
  },

  // For streaming responses (if backend supports)
  async sendMessageStream(
    conversationId: number,
    content: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

      const response = await fetch(
        `${baseURL}/conversations/${conversationId}/messages`,
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

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete();
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      onError(error as Error);
    }
  },
};
