import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import { childrenApi, conversationsApi, Child, Conversation, Message } from '../../api';
import {
    Send,
    ArrowLeft,
    MessageCircle,
    Plus,
    Sparkles,
    User,
    Clock,
    Baby,
    Heart,
    Trash2,
    ChevronDown
} from 'lucide-react';

interface ChatPageProps {
    isDark: boolean;
    toggleTheme: () => void;
}

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ChatPage = ({ isDark, toggleTheme }: ChatPageProps) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // State
    const [children, setChildren] = useState<Child[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showChildSelector, setShowChildSelector] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [childrenData, conversationsData] = await Promise.all([
                    childrenApi.getAll(),
                    conversationsApi.getAll(),
                ]);
                setChildren(childrenData);
                setConversations(conversationsData);

                // Check for child param in URL
                const childParam = searchParams.get('child');
                if (childParam) {
                    setSelectedChildId(parseInt(childParam));
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [searchParams]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversation = async (conversation: Conversation) => {
        try {
            const fullConversation = await conversationsApi.getById(conversation.id);
            setActiveConversation(fullConversation);
            setMessages(fullConversation.messages || []);
            setSelectedChildId(fullConversation.child_id);
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    };

    const startNewConversation = async (childId: number) => {
        try {
            const conversation = await conversationsApi.create({
                child_id: childId,
            });
            setActiveConversation(conversation);
            setMessages([]);
            setSelectedChildId(childId);
            setShowChildSelector(false);

            // Refresh conversations list
            const conversationsData = await conversationsApi.getAll();
            setConversations(conversationsData);
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !activeConversation || isSending) return;

        const messageContent = inputMessage.trim();
        setInputMessage('');
        setIsSending(true);

        // Optimistically add user message
        const tempUserMessage: Message = {
            id: Date.now(),
            conversation_id: activeConversation.id,
            role: 'user',
            content: messageContent,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            const response = await conversationsApi.sendMessage(activeConversation.id, messageContent);

            // Create the assistant message from response
            const assistantMessage: Message = {
                id: response.message_id,
                conversation_id: activeConversation.id,
                role: 'assistant',
                content: response.content,
                created_at: new Date().toISOString(),
            };

            // Keep the user message (update with a stable ID) and add assistant response
            setMessages(prev => [
                ...prev.map(m => m.id === tempUserMessage.id
                    ? { ...m, id: tempUserMessage.id }  // Keep user message
                    : m
                ),
                assistantMessage,
            ]);

            // Update conversation title if a new one was generated
            if (response.new_title) {
                setActiveConversation(prev => prev ? { ...prev, title: response.new_title! } : null);
                setConversations(prev =>
                    prev.map(c => c.id === activeConversation.id
                        ? { ...c, title: response.new_title! }
                        : c
                    )
                );
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
            setInputMessage(messageContent); // Restore message
        } finally {
            setIsSending(false);
        }
    };

    const deleteConversation = async (id: number) => {
        if (!confirm('Delete this conversation? This cannot be undone.')) return;

        try {
            await conversationsApi.delete(id);
            setConversations(prev => prev.filter(c => c.id !== id));
            if (activeConversation?.id === id) {
                setActiveConversation(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    };

    const getChildName = (childId: number) => {
        return children.find(c => c.id === childId)?.name || 'Unknown';
    };

    const filteredConversations = selectedChildId
        ? conversations.filter(c => c.child_id === selectedChildId)
        : conversations;

    if (isLoading) {
        return (
            <Layout isDark={isDark} toggleTheme={toggleTheme}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    // No children - redirect to add one
    if (children.length === 0) {
        return (
            <Layout isDark={isDark} toggleTheme={toggleTheme}>
                <div className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-950/50 dark:to-rose-950/50 flex items-center justify-center">
                        <Baby className="w-12 h-12 text-primary-500" />
                    </div>
                    <h2 className="text-3xl font-semibold text-warm-800 dark:text-warm-50 mb-4">
                        Add a child first
                    </h2>
                    <p className="text-warm-500 dark:text-warm-400 text-lg mb-8 max-w-md mx-auto">
                        Before we can chat, please add a child profile so we can personalize our guidance.
                    </p>
                    <Button variant="primary" size="lg" onClick={() => navigate('/children')}>
                        <Plus className="w-5 h-5 mr-2" />
                        Add a Child
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout isDark={isDark} toggleTheme={toggleTheme}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex gap-6 h-[calc(100vh-200px)] min-h-[500px]">
                    {/* Sidebar - Conversations List */}
                    <div className="hidden lg:flex flex-col w-80 flex-shrink-0">
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            {/* Sidebar Header */}
                            <div className="p-4 border-b border-warm-100 dark:border-warm-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-warm-800 dark:text-warm-50">
                                        Conversations
                                    </h2>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setShowChildSelector(true)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Child Filter */}
                                <select
                                    value={selectedChildId || ''}
                                    onChange={(e) => setSelectedChildId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 rounded-xl bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                                >
                                    <option value="">All children</option>
                                    {children.map(child => (
                                        <option key={child.id} value={child.id}>{child.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Conversations List */}
                            <div className="flex-1 overflow-y-auto p-2">
                                {filteredConversations.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <MessageCircle className="w-10 h-10 mx-auto mb-3 text-warm-300 dark:text-warm-600" />
                                        <p className="text-warm-500 dark:text-warm-400 text-sm">
                                            No conversations yet
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredConversations.map(conversation => (
                                            <button
                                                key={conversation.id}
                                                onClick={() => loadConversation(conversation)}
                                                className={`w-full text-left p-3 rounded-2xl transition-all group ${
                                                    activeConversation?.id === conversation.id
                                                        ? 'bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900'
                                                        : 'hover:bg-warm-50 dark:hover:bg-warm-800'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-medium truncate ${
                                                            activeConversation?.id === conversation.id
                                                                ? 'text-primary-700 dark:text-primary-300'
                                                                : 'text-warm-700 dark:text-warm-200'
                                                        }`}>
                                                            {conversation.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-warm-500 dark:text-warm-400">
                                                                {getChildName(conversation.child_id)}
                                                            </span>
                                                            <span className="text-warm-300 dark:text-warm-600">·</span>
                                                            <span className="text-xs text-warm-400 dark:text-warm-500">
                                                                {formatDate(conversation.updated_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteConversation(conversation.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-warm-400 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            {!activeConversation ? (
                                /* No Active Conversation */
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-950/50 dark:to-rose-950/50 flex items-center justify-center">
                                        <Heart className="w-10 h-10 text-primary-500" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-warm-800 dark:text-warm-50 mb-3">
                                        Start a conversation
                                    </h3>
                                    <p className="text-warm-500 dark:text-warm-400 max-w-sm mb-8">
                                        Choose a child to get personalized guidance and support for their unique needs.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {children.map(child => (
                                            <Button
                                                key={child.id}
                                                variant="secondary"
                                                onClick={() => startNewConversation(child.id)}
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Chat about {child.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Chat Header */}
                                    <div className="px-6 py-4 border-b border-warm-100 dark:border-warm-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    setActiveConversation(null);
                                                    setMessages([]);
                                                }}
                                                className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
                                            >
                                                <ArrowLeft className="w-5 h-5 text-warm-500" />
                                            </button>
                                            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-warm-800 dark:text-warm-50">
                                                    {activeConversation.title}
                                                </h3>
                                                <p className="text-sm text-warm-500 dark:text-warm-400">
                                                    About {getChildName(activeConversation.child_id)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {messages.length === 0 && (
                                            <div className="text-center py-12">
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 text-sm mb-4">
                                                    <Sparkles className="w-4 h-4" />
                                                    Start of conversation
                                                </div>
                                                <p className="text-warm-500 dark:text-warm-400 max-w-md mx-auto">
                                                    Share what's on your mind. I'm here to help with any parenting questions or concerns about {getChildName(activeConversation.child_id)}.
                                                </p>
                                            </div>
                                        )}

                                        {messages.map((message, index) => (
                                            <div
                                                key={message.id}
                                                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                            >
                                                {/* Avatar */}
                                                <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                                                    message.role === 'user'
                                                        ? 'bg-primary-100 dark:bg-primary-950/50'
                                                        : 'bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-950/50 dark:to-rose-950/50'
                                                }`}>
                                                    {message.role === 'user' ? (
                                                        <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    ) : (
                                                        <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    )}
                                                </div>

                                                {/* Message Bubble */}
                                                <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                                                    <div className={`inline-block px-5 py-3 rounded-2xl ${
                                                        message.role === 'user'
                                                            ? 'bg-primary-600 text-white rounded-tr-md'
                                                            : 'bg-warm-100 dark:bg-warm-800 text-warm-800 dark:text-warm-100 rounded-tl-md'
                                                    }`}>
                                                        <p className="whitespace-pre-wrap leading-relaxed">
                                                            {message.content}
                                                        </p>
                                                    </div>
                                                    <p className={`text-xs text-warm-400 dark:text-warm-500 mt-1.5 ${
                                                        message.role === 'user' ? 'text-right' : ''
                                                    }`}>
                                                        {formatTime(message.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Typing Indicator */}
                                        {isSending && (
                                            <div className="flex gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-950/50 dark:to-rose-950/50 flex items-center justify-center">
                                                    <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div className="bg-warm-100 dark:bg-warm-800 rounded-2xl rounded-tl-md px-5 py-4">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                        <div className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                        <div className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-4 border-t border-warm-100 dark:border-warm-800">
                                        <form onSubmit={sendMessage} className="flex gap-3">
                                            <input
                                                type="text"
                                                value={inputMessage}
                                                onChange={(e) => setInputMessage(e.target.value)}
                                                placeholder="Type your message..."
                                                disabled={isSending}
                                                className="flex-1 px-5 py-3 rounded-2xl bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-warm-800 dark:text-warm-100 placeholder:text-warm-400 dark:placeholder:text-warm-500 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all disabled:opacity-50"
                                            />
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={!inputMessage.trim() || isSending}
                                                className="px-5"
                                            >
                                                <Send className="w-5 h-5" />
                                            </Button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Child Selector Modal */}
            {showChildSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-warm-900/60 dark:bg-warm-950/80 backdrop-blur-sm"
                        onClick={() => setShowChildSelector(false)}
                    ></div>
                    <Card className="relative w-full max-w-sm p-6">
                        <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-4">
                            Start new conversation
                        </h3>
                        <p className="text-warm-500 dark:text-warm-400 text-sm mb-4">
                            Which child would you like to discuss?
                        </p>
                        <div className="space-y-2">
                            {children.map(child => (
                                <button
                                    key={child.id}
                                    onClick={() => startNewConversation(child.id)}
                                    className="w-full text-left p-4 rounded-2xl border border-warm-200 dark:border-warm-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                                        {child.name[0]}
                                    </div>
                                    <span className="font-medium text-warm-700 dark:text-warm-200">
                                        {child.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full mt-4"
                            onClick={() => setShowChildSelector(false)}
                        >
                            Cancel
                        </Button>
                    </Card>
                </div>
            )}
        </Layout>
    );
};

export default ChatPage;
