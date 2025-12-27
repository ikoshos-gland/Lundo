import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader } from 'lucide-react';
import { conversationService } from '@/services/conversationService';
import { handleApiError } from '@/services/api';
import { Conversation, Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/shared/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface ChatInterfaceProps {
  conversationId: number;
  onBack?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversationId, onBack }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  const fetchConversation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await conversationService.getById(conversationId);
      setConversation(data);
      setMessages(data.messages || []);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);
    setError(null);

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await conversationService.sendMessage(conversationId, {
        content: userMessage,
      });

      // Add assistant response
      setMessages(prev => [...prev, response]);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] bg-white dark:bg-warm-900 rounded-2xl border-2 border-warm-200 dark:border-warm-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-warm-200 dark:border-warm-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-warm-800 dark:text-warm-50">
            {conversation?.title || 'Conversation'}
          </h2>
          <p className="text-sm text-warm-600 dark:text-warm-400">
            AI Behavioral Therapist
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack} size="sm">
            Back
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 chat-scroll">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-warm-600 dark:text-warm-400 mb-2">
                No messages yet
              </p>
              <p className="text-sm text-warm-500 dark:text-warm-500">
                Start the conversation by asking a question
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isSending && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-warm-200 dark:bg-warm-800">
              <Loader className="h-4 w-4 text-warm-600 dark:text-warm-400 animate-spin" />
            </div>
            <div className="flex-1">
              <div className="rounded-2xl px-4 py-3 bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700">
                <p className="text-sm text-warm-600 dark:text-warm-400">
                  AI is thinking...
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-warm-200 dark:border-warm-800">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your child's behavior..."
            className="flex-1 px-4 py-3 rounded-xl bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-warm-800 dark:text-warm-50 placeholder-warm-400 dark:placeholder-warm-600 focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isSending}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!inputValue.trim() || isSending}
            className="px-6"
          >
            {isSending ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
