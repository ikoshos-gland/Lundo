import { useState, useEffect } from 'react';
import { conversationService } from '@/services/conversationService';
import { handleApiError } from '@/services/api';
import { Conversation, ConversationCreate, ConversationListItem } from '@/types';

export function useConversations(childId?: number) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await conversationService.getAll(childId);
      setConversations(data);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (data: ConversationCreate): Promise<Conversation> => {
    setError(null);
    try {
      const newConversation = await conversationService.create(data);
      // Manually update state to ensure UI reflects change immediately
      setConversations(prev => [newConversation as ConversationListItem, ...prev]);
      return newConversation;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    }
  };

  const deleteConversation = async (id: number): Promise<void> => {
    setError(null);
    try {
      await conversationService.delete(id);
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [childId]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    createConversation,
    deleteConversation,
  };
}
