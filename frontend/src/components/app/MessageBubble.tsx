import React from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import { Message } from '@/types';
import { formatRelativeTime } from '@/utils/dateFormatter';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-accent/20' : 'bg-warm-200 dark:bg-warm-800'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-accent" />
        ) : (
          <Bot className="h-4 w-4 text-warm-600 dark:text-warm-400" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-accent text-white'
            : 'bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-warm-800 dark:text-warm-50'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-warm-500 dark:text-warm-500">
            {formatRelativeTime(message.created_at)}
          </span>

          {/* Agents used */}
          {message.metadata?.agents_used && message.metadata.agents_used.length > 0 && (
            <span className="text-xs text-warm-500 dark:text-warm-500">
              • {message.metadata.agents_used.join(', ')}
            </span>
          )}

          {/* Safety flag */}
          {message.metadata?.requires_human_review && (
            <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-3 w-3" />
              Needs review
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
