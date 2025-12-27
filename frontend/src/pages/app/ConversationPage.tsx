import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChildren } from '@/contexts/ChildrenContext';
import { useConversations } from '@/hooks/useConversations';
import { ChatInterface } from '@/components/app/ChatInterface';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Modal } from '@/components/shared/Modal';
import { formatRelativeTime } from '@/utils/dateFormatter';

export const ConversationPage: React.FC = () => {
  const navigate = useNavigate();
  const { children, isLoading: childrenLoading } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>();
  const { conversations, isLoading, createConversation, deleteConversation } = useConversations(selectedChildId);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newConvChildId, setNewConvChildId] = useState<number | null>(null);

  const handleCreateConversation = async () => {
    if (!newConvChildId) return;

    try {
      const conversation = await createConversation({
        child_id: newConvChildId,
        title: 'New Conversation',
      });
      setIsModalOpen(false);
      setActiveConversationId(conversation.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  // If a conversation is active, show the chat interface
  if (activeConversationId) {
    return (
      <div>
        <ChatInterface
          conversationId={activeConversationId}
          onBack={() => setActiveConversationId(null)}
        />
      </div>
    );
  }

  if (childrenLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-warm-800 dark:text-warm-50 mb-2">
            Conversations
          </h1>
          <p className="text-warm-600 dark:text-warm-400">
            Chat with your AI behavioral therapist
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            if (children.length === 0) {
              navigate('/app/children');
            } else {
              setIsModalOpen(true);
            }
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Conversation
        </Button>
      </div>

      {/* Filter by child */}
      {children.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
            Filter by child
          </label>
          <select
            value={selectedChildId || ''}
            onChange={(e) => setSelectedChildId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 rounded-lg bg-white dark:bg-warm-900 border-2 border-warm-300 dark:border-warm-700 text-warm-800 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All children</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Conversations List */}
      {children.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warm-100 dark:bg-warm-800 mb-4">
              <MessageSquare className="h-8 w-8 text-warm-400 dark:text-warm-600" />
            </div>
            <h3 className="text-xl font-semibold text-warm-800 dark:text-warm-50 mb-2">
              Add a child first
            </h3>
            <p className="text-warm-600 dark:text-warm-400 mb-6">
              You need to add a child before starting a conversation
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/app/children')}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Child
            </Button>
          </div>
        </Card>
      ) : conversations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warm-100 dark:bg-warm-800 mb-4">
              <MessageSquare className="h-8 w-8 text-warm-400 dark:text-warm-600" />
            </div>
            <h3 className="text-xl font-semibold text-warm-800 dark:text-warm-50 mb-2">
              No conversations yet
            </h3>
            <p className="text-warm-600 dark:text-warm-400 mb-6">
              Start your first conversation with the AI therapist
            </p>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Conversation
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveConversationId(conversation.id)}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-1">
                    {conversation.title || 'Untitled Conversation'}
                  </h3>
                  {conversation.last_message && (
                    <p className="text-sm text-warm-600 dark:text-warm-400 line-clamp-2 mb-2">
                      {conversation.last_message}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-warm-500 dark:text-warm-500">
                    <span>{conversation.message_count || 0} messages</span>
                    {conversation.last_message_at && (
                      <>
                        <span>•</span>
                        <span>{formatRelativeTime(conversation.last_message_at)}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this conversation?')) {
                      deleteConversation(conversation.id);
                    }
                  }}
                  className="text-warm-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Conversation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Conversation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              Select a child
            </label>
            <select
              value={newConvChildId || ''}
              onChange={(e) => setNewConvChildId(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-warm-900 border-2 border-warm-300 dark:border-warm-700 text-warm-800 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Choose a child...</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateConversation}
              disabled={!newConvChildId}
              className="flex-1"
            >
              Start Conversation
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
