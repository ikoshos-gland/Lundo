import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Layout } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import { childrenApi, conversationsApi, Child, Conversation, Message, ExplorationQuestionEvent } from '../../api';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { QuestionCard, ExplorationProgress } from './components';
import {
    Send,
    ArrowLeft,
    MessageCircle,
    Plus,
    Sparkles,
    User,
    Baby,
    Heart,
    Trash2,
    Copy,
    Check,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    Search,
    X,
    Menu,
    ChevronRight,
    Zap,
    BookOpen,
    HelpCircle,
    Lightbulb,
    Command,
    CornerDownLeft,
    Pencil,
    MoreVertical
} from 'lucide-react';

interface ChatPageProps {
    isDark: boolean;
    toggleTheme: () => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

// ============================================
// SUGGESTED PROMPTS
// ============================================

const SUGGESTED_PROMPTS = [
    {
        icon: Zap,
        title: "Sleep struggles",
        prompt: "My child is having trouble falling asleep at night. What strategies can help?",
        gradient: "from-amber-500 to-orange-500"
    },
    {
        icon: BookOpen,
        title: "Learning & focus",
        prompt: "How can I help my child focus better during homework time?",
        gradient: "from-blue-500 to-indigo-500"
    },
    {
        icon: HelpCircle,
        title: "Behavior concerns",
        prompt: "My child has been having tantrums lately. How should I respond?",
        gradient: "from-rose-500 to-pink-500"
    },
    {
        icon: Lightbulb,
        title: "Development tips",
        prompt: "What developmental milestones should I look for at this age?",
        gradient: "from-emerald-500 to-teal-500"
    }
];


// ============================================
// MESSAGE BUBBLE COMPONENT
// ============================================

interface MessageBubbleProps {
    message: Message;
    isLatestAssistant: boolean;
    isStreaming: boolean;
    onCopy: () => void;
    onRegenerate?: () => void;
    onFeedback?: (type: 'up' | 'down') => void;
}

const MessageBubble = ({
    message,
    isLatestAssistant,
    isStreaming,
    onCopy,
    onRegenerate,
    onFeedback
}: MessageBubbleProps) => {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
    const [showActions, setShowActions] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        onCopy();
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFeedback = (type: 'up' | 'down') => {
        setFeedback(type);
        onFeedback?.(type);
    };

    const isUser = message.role === 'user';
    // Content is updated directly from the stream now
    const content = message.content;
    // Show cursor when streaming and this is the latest assistant message
    const showCursor = isLatestAssistant && isStreaming && message.role === 'assistant';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Avatar */}
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${isUser
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                    : 'bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-900/50 dark:to-rose-900/50'
                    }`}
            >
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                )}
            </motion.div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                <div className={`relative inline-block text-left ${isUser
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-primary-500/20'
                    : 'bg-white dark:bg-warm-800/80 text-warm-800 dark:text-warm-100 rounded-2xl rounded-tl-sm shadow-md border border-warm-100 dark:border-warm-700/50'
                    }`}>
                    <div className="px-5 py-3.5">
                        {isUser ? (
                            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                        ) : (
                            <div className="prose prose-warm dark:prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:my-2 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:before:content-none prose-code:after:content-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const codeString = String(children).replace(/\n$/, '');

                                            if (match) {
                                                return (
                                                    <div className="relative group/code my-3">
                                                        <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                                            <span className="text-xs text-warm-400 bg-warm-800 px-2 py-0.5 rounded">
                                                                {match[1]}
                                                            </span>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(codeString)}
                                                                className="p-1.5 rounded-lg bg-warm-700 hover:bg-warm-600 text-warm-300 transition-colors"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <SyntaxHighlighter
                                                            style={oneDark}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            className="!rounded-xl !text-sm !bg-warm-900 dark:!bg-warm-950"
                                                        >
                                                            {codeString}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <code className="px-1.5 py-0.5 rounded-md bg-warm-100 dark:bg-warm-700/50 text-sm font-mono" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                        a({ href, children }) {
                                            return (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary-600 dark:text-primary-400 hover:underline"
                                                >
                                                    {children}
                                                </a>
                                            );
                                        },
                                        ul({ children }) {
                                            return <ul className="list-disc pl-4 space-y-1">{children}</ul>;
                                        },
                                        ol({ children }) {
                                            return <ol className="list-decimal pl-4 space-y-1">{children}</ol>;
                                        },
                                        blockquote({ children }) {
                                            return (
                                                <blockquote className="border-l-4 border-primary-300 dark:border-primary-600 pl-4 italic text-warm-600 dark:text-warm-400">
                                                    {children}
                                                </blockquote>
                                            );
                                        }
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {/* Typing cursor */}
                    {showCursor && (
                        <span className="inline-block w-0.5 h-4 bg-primary-500 animate-pulse ml-0.5" />
                    )}
                </div>

                {/* Message Meta & Actions */}
                <div className={`flex items-center gap-3 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-warm-400 dark:text-warm-500">
                        {formatTime(message.created_at)}
                    </span>

                    {/* Actions for assistant messages */}
                    {!isUser && (
                        <AnimatePresence>
                            {(showActions || copied || feedback) && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-1"
                                >
                                    <button
                                        onClick={handleCopy}
                                        className={`p-1.5 rounded-lg transition-all ${copied
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                            : 'hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300'
                                            }`}
                                        title="Copy message"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>

                                    {onRegenerate && (
                                        <button
                                            onClick={onRegenerate}
                                            className="p-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-all"
                                            title="Regenerate response"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    <div className="w-px h-4 bg-warm-200 dark:bg-warm-700 mx-1" />

                                    <button
                                        onClick={() => handleFeedback('up')}
                                        className={`p-1.5 rounded-lg transition-all ${feedback === 'up'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                            : 'hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300'
                                            }`}
                                        title="Good response"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleFeedback('down')}
                                        className={`p-1.5 rounded-lg transition-all ${feedback === 'down'
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                            : 'hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300'
                                            }`}
                                        title="Poor response"
                                    >
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ============================================
// AUTO-RESIZING TEXTAREA COMPONENT
// ============================================

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
}

const ChatInput = ({ value, onChange, onSubmit, disabled, placeholder, maxLength = 4000 }: ChatInputProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            if (value.trim() && !disabled) {
                onSubmit();
            }
        }
    };

    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return (
        <div className="relative">
            <div className="relative bg-white dark:bg-warm-800 rounded-2xl border-2 border-warm-200 dark:border-warm-700 focus-within:border-primary-400 dark:focus-within:border-primary-500 transition-all shadow-sm focus-within:shadow-lg focus-within:shadow-primary-500/10">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => {
                        if (e.target.value.length <= maxLength) {
                            onChange(e.target.value);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="w-full px-5 py-4 pr-32 bg-transparent text-warm-800 dark:text-warm-100 placeholder:text-warm-400 dark:placeholder:text-warm-500 focus:outline-none resize-none disabled:opacity-50 text-[15px] leading-relaxed"
                    style={{ maxHeight: '200px' }}
                />

                {/* Bottom bar with character count and send button */}
                <div className="absolute bottom-2 right-2 flex items-center gap-3">
                    {/* Character count */}
                    <div className={`text-xs transition-colors ${value.length > maxLength * 0.9
                        ? 'text-red-500'
                        : 'text-warm-400 dark:text-warm-500'
                        }`}>
                        {value.length > 0 && (
                            <span>{value.length.toLocaleString()}/{maxLength.toLocaleString()}</span>
                        )}
                    </div>

                    {/* Keyboard shortcut hint */}
                    <div className="hidden sm:flex items-center gap-1 text-xs text-warm-400 dark:text-warm-500">
                        {isMac ? (
                            <Command className="w-3 h-3" />
                        ) : (
                            <span className="text-[10px]">Ctrl</span>
                        )}
                        <CornerDownLeft className="w-3 h-3" />
                    </div>

                    {/* Send button */}
                    <motion.button
                        type="button"
                        onClick={onSubmit}
                        disabled={!value.trim() || disabled}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2.5 rounded-xl transition-all ${value.trim() && !disabled
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40'
                            : 'bg-warm-100 dark:bg-warm-700 text-warm-400 dark:text-warm-500 cursor-not-allowed'
                            }`}
                    >
                        <Send className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// CONVERSATION SIDEBAR COMPONENT
// ============================================

interface ConversationSidebarProps {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    children: Child[];
    selectedChildId: number | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelectConversation: (conversation: Conversation) => void;
    onDeleteConversation: (id: number) => void;
    onRenameConversation: (id: number, newTitle: string) => void;
    onNewConversation: () => void;
    onChildFilterChange: (childId: number | null) => void;
    getChildName: (childId: number) => string;
    isOpen?: boolean;
    onClose?: () => void;
}

const ConversationSidebar = ({
    conversations,
    activeConversation,
    children,
    selectedChildId,
    searchQuery,
    onSearchChange,
    onSelectConversation,
    onDeleteConversation,
    onRenameConversation,
    onNewConversation,
    onChildFilterChange,
    getChildName,
    isOpen = true,
    onClose
}: ConversationSidebarProps) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuOpenId !== null && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenId(null);
            }
        };

        // Use setTimeout to let the click event fire first
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [menuOpenId]);

    const startEditing = (conv: Conversation) => {
        setEditingId(conv.id);
        setEditTitle(conv.title);
        setMenuOpenId(null);
    };

    const saveEdit = () => {
        if (editingId && editTitle.trim()) {
            onRenameConversation(editingId, editTitle.trim());
        }
        setEditingId(null);
        setEditTitle('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
    };


    const filteredConversations = useMemo(() => {
        let result = selectedChildId
            ? conversations.filter(c => c.child_id === selectedChildId)
            : conversations;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.title.toLowerCase().includes(query) ||
                getChildName(c.child_id).toLowerCase().includes(query)
            );
        }

        return result;
    }, [conversations, selectedChildId, searchQuery, getChildName]);

    // Group by date
    const groupedConversations = useMemo(() => {
        const groups: { [key: string]: Conversation[] } = {};
        filteredConversations.forEach(conv => {
            const dateKey = formatDate(conv.updated_at);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(conv);
        });
        return groups;
    }, [filteredConversations]);

    return (
        <motion.div
            initial={false}
            animate={{ x: isOpen ? 0 : -320 }}
            className={`flex flex-col bg-white dark:bg-warm-900 border-r border-warm-100 dark:border-warm-800 h-full ${onClose ? 'fixed inset-y-0 left-0 z-50 w-80 shadow-2xl lg:relative lg:shadow-none' : 'w-80'
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-warm-100 dark:border-warm-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-warm-800 dark:text-warm-50 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary-500" />
                        Chats
                    </h2>
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onNewConversation}
                            className="p-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 transition-shadow"
                        >
                            <Plus className="w-4 h-4" />
                        </motion.button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="lg:hidden p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 text-sm placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-warm-200 dark:hover:bg-warm-700 text-warm-400"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Child Filter */}
                <select
                    value={selectedChildId || ''}
                    onChange={(e) => onChildFilterChange(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2.5 rounded-xl bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                >
                    <option value="">All children</option>
                    {children.map(child => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                </select>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto chat-scroll p-2">
                {Object.keys(groupedConversations).length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
                            <MessageCircle className="w-8 h-8 text-warm-300 dark:text-warm-600" />
                        </div>
                        <p className="text-warm-500 dark:text-warm-400 text-sm font-medium">
                            {searchQuery ? 'No matches found' : 'No conversations yet'}
                        </p>
                        <p className="text-warm-400 dark:text-warm-500 text-xs mt-1">
                            {searchQuery ? 'Try a different search' : 'Start a new chat to begin'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedConversations).map(([date, convs]) => (
                            <div key={date}>
                                <div className="px-3 py-2 text-xs font-medium text-warm-400 dark:text-warm-500 uppercase tracking-wider">
                                    {date}
                                </div>
                                <div className="space-y-1">
                                    {convs.map(conversation => (
                                        <motion.div
                                            key={conversation.id}
                                            whileHover={{ x: 4 }}
                                            className={`relative rounded-xl transition-all group ${activeConversation?.id === conversation.id
                                                ? 'bg-gradient-to-r from-primary-50 to-rose-50 dark:from-primary-950/40 dark:to-rose-950/40 border border-primary-200 dark:border-primary-800'
                                                : 'hover:bg-warm-50 dark:hover:bg-warm-800/50'
                                                }`}
                                            style={{ zIndex: menuOpenId === conversation.id ? 100 : 1 }}
                                        >
                                            {editingId === conversation.id ? (
                                                /* Edit Mode */
                                                <div className="p-3">
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveEdit();
                                                            if (e.key === 'Escape') cancelEdit();
                                                        }}
                                                        className="w-full px-2 py-1 text-sm rounded-lg bg-white dark:bg-warm-800 border border-primary-300 dark:border-primary-600 text-warm-800 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={saveEdit}
                                                            className="flex-1 px-2 py-1 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="flex-1 px-2 py-1 text-xs bg-warm-200 dark:bg-warm-700 text-warm-700 dark:text-warm-300 rounded-lg hover:bg-warm-300 dark:hover:bg-warm-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Normal Mode */
                                                <div className="w-full text-left p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div
                                                            className="flex-1 min-w-0 cursor-pointer"
                                                            onClick={() => onSelectConversation(conversation)}
                                                        >
                                                            <p className={`font-medium truncate text-sm ${activeConversation?.id === conversation.id
                                                                ? 'text-primary-700 dark:text-primary-300'
                                                                : 'text-warm-700 dark:text-warm-200'
                                                                }`}>
                                                                {conversation.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${activeConversation?.id === conversation.id
                                                                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                                                                    : 'bg-warm-100 dark:bg-warm-700 text-warm-500 dark:text-warm-400'
                                                                    }`}>
                                                                    {getChildName(conversation.child_id)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {/* Action Menu Button */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setMenuOpenId(menuOpenId === conversation.id ? null : conversation.id);
                                                                }}
                                                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-warm-200 dark:hover:bg-warm-700 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-all"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            {/* Dropdown Menu */}
                                                            <AnimatePresence>
                                                                {menuOpenId === conversation.id && (
                                                                    <motion.div
                                                                        ref={menuRef}
                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                                        className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-warm-800 rounded-xl shadow-lg border border-warm-200 dark:border-warm-700 py-1 min-w-[120px]"
                                                                    >
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                startEditing(conversation);
                                                                            }}
                                                                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-700 dark:text-warm-300"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                            Rename
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                console.log('Delete button clicked!', conversation.id);
                                                                                e.stopPropagation();
                                                                                e.preventDefault();
                                                                                const conversationIdToDelete = conversation.id;
                                                                                setMenuOpenId(null);
                                                                                // Use setTimeout to ensure delete happens after menu closes
                                                                                setTimeout(() => {
                                                                                    onDeleteConversation(conversationIdToDelete);
                                                                                }, 0);
                                                                            }}
                                                                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                            Delete
                                                                        </button>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {activeConversation?.id === conversation.id && (
                                                <motion.div
                                                    layoutId="activeIndicator"
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary-500"
                                                />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ============================================
// TYPING INDICATOR COMPONENT
// ============================================

const TypingIndicator = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex gap-3"
    >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-900/50 dark:to-rose-900/50 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="bg-white dark:bg-warm-800/80 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md border border-warm-100 dark:border-warm-700/50">
            <div className="flex items-center gap-1.5">
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-primary-400 rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                    className="w-2 h-2 bg-primary-400 rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                    className="w-2 h-2 bg-primary-400 rounded-full"
                />
            </div>
        </div>
    </motion.div>
);

// ============================================
// MAIN CHAT PAGE COMPONENT
// ============================================

const ChatPage = ({ isDark, toggleTheme }: ChatPageProps) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

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
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    // Exploration mode state
    const [isExplorationMode, setIsExplorationMode] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<ExplorationQuestionEvent | null>(null);
    const [explorationProgress, setExplorationProgress] = useState(0);

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
    }, [messages, isSending]);

    const loadConversation = async (conversation: Conversation) => {
        try {
            const fullConversation = await conversationsApi.getById(conversation.id);
            setActiveConversation(fullConversation);
            setMessages(fullConversation.messages || []);
            setSelectedChildId(fullConversation.child_id);
            setIsMobileSidebarOpen(false);
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    };

    const startNewConversation = async (childId: number) => {
        try {
            const conversation = await conversationsApi.create({ child_id: childId });
            setActiveConversation(conversation);
            setMessages([]);
            setSelectedChildId(childId);
            setShowChildSelector(false);

            const conversationsData = await conversationsApi.getAll();
            setConversations(conversationsData);
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const sendMessage = async (content?: string) => {
        const messageContent = content || inputMessage.trim();
        if (!messageContent || !activeConversation || isSending) return;

        setInputMessage('');
        setIsSending(true);
        setIsStreaming(true);

        const tempUserMessage: Message = {
            id: Date.now(),
            conversation_id: activeConversation.id,
            role: 'user',
            content: messageContent,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMessage]);

        // Create a placeholder for the streaming assistant message
        const streamingMessageId = Date.now() + 1;
        const streamingMessage: Message = {
            id: streamingMessageId,
            conversation_id: activeConversation.id,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
        };

        try {
            // Add the empty assistant message that will be filled with streamed content
            setMessages(prev => [...prev, streamingMessage]);

            // Stream the response
            let streamedContent = '';
            let finalMessageId = streamingMessageId;

            for await (const event of conversationsApi.sendMessageStream(
                activeConversation.id,
                messageContent
            )) {
                if (event.type === 'token') {
                    // Append token to the streaming message
                    streamedContent += event.data.content;
                    setMessages(prev =>
                        prev.map(m =>
                            m.id === streamingMessageId
                                ? { ...m, content: streamedContent }
                                : m
                        )
                    );
                } else if (event.type === 'done') {
                    // Update with final message ID and handle title update
                    finalMessageId = event.data.message_id;
                    setMessages(prev =>
                        prev.map(m =>
                            m.id === streamingMessageId
                                ? { ...m, id: finalMessageId, content: streamedContent }
                                : m
                        )
                    );

                    if (event.data.new_title) {
                        setActiveConversation(prev =>
                            prev ? { ...prev, title: event.data.new_title! } : null
                        );
                        setConversations(prev =>
                            prev.map(c =>
                                c.id === activeConversation.id
                                    ? { ...c, title: event.data.new_title! }
                                    : c
                            )
                        );
                    }
                } else if (event.type === 'exploration_question') {
                    // Enter exploration mode with the question
                    setIsExplorationMode(true);
                    setCurrentQuestion(event.data);
                    setExplorationProgress(event.data.question_number);
                    // Remove the placeholder messages since we're in exploration mode
                    setMessages(prev => prev.filter(m =>
                        m.id !== tempUserMessage.id && m.id !== streamingMessageId
                    ));
                } else if (event.type === 'exploration_complete') {
                    // Exit exploration mode
                    setIsExplorationMode(false);
                    setCurrentQuestion(null);
                    setExplorationProgress(0);
                    // The main workflow will now run automatically
                } else if (event.type === 'error') {
                    console.error('Stream error:', event.data.error);
                    throw new Error(event.data.error);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove both user and streaming messages on error
            setMessages(prev => prev.filter(m =>
                m.id !== tempUserMessage.id && m.id !== streamingMessage.id
            ));
            setInputMessage(messageContent);
        } finally {
            setIsSending(false);
            setIsStreaming(false);
        }
    };

    // Handle exploration answer submission
    const submitExplorationAnswer = async (answer: string) => {
        if (!activeConversation || isSending) return;

        setIsSending(true);

        try {
            for await (const event of conversationsApi.submitExplorationAnswer(
                activeConversation.id,
                answer
            )) {
                if (event.type === 'exploration_question') {
                    // Show next question
                    setCurrentQuestion(event.data);
                    setExplorationProgress(event.data.question_number);
                } else if (event.type === 'exploration_complete') {
                    // Exit exploration mode - main workflow will run
                    setIsExplorationMode(false);
                    setCurrentQuestion(null);
                    setExplorationProgress(0);

                    // Now send a message to trigger the main workflow
                    // The exploration context is already saved, just need to trigger analysis
                    setIsSending(false);
                    await sendMessage(event.data.initial_concern);
                    return;
                } else if (event.type === 'error') {
                    console.error('Exploration error:', event.data.error);
                    throw new Error(event.data.error);
                }
            }
        } catch (error) {
            console.error('Failed to submit exploration answer:', error);
        } finally {
            setIsSending(false);
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);

    const deleteConversation = (id: number) => {
        setConversationToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!conversationToDelete) return;

        try {
            await conversationsApi.delete(conversationToDelete);
            setConversations(prev => prev.filter(c => c.id !== conversationToDelete));
            if (activeConversation?.id === conversationToDelete) {
                setActiveConversation(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    };

    const renameConversation = (id: number, newTitle: string) => {
        // Update locally (API call can be added if backend supports it)
        setConversations(prev =>
            prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
        );
        if (activeConversation?.id === id) {
            setActiveConversation(prev => prev ? { ...prev, title: newTitle } : null);
        }
    };

    const getChildName = useCallback((childId: number) => {
        return children.find(c => c.id === childId)?.name || 'Unknown';
    }, [children]);

    const handleSuggestedPrompt = (prompt: string) => {
        if (activeConversation) {
            sendMessage(prompt);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <Layout isDark={isDark} toggleTheme={toggleTheme}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"
                    />
                </div>
            </Layout>
        );
    }

    // No children state
    if (children.length === 0) {
        return (
            <Layout isDark={isDark} toggleTheme={toggleTheme}>
                <div className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-950/50 dark:to-rose-950/50 flex items-center justify-center shadow-xl shadow-primary-500/10"
                    >
                        <Baby className="w-12 h-12 text-primary-500" />
                    </motion.div>
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
            <div className="h-[calc(100vh-140px)] max-w-[1600px] mx-auto">
                <div className="flex h-full bg-warm-50 dark:bg-warm-950 rounded-2xl overflow-hidden border border-warm-200 dark:border-warm-800 shadow-xl">

                    {/* Mobile Sidebar Overlay */}
                    <AnimatePresence>
                        {isMobileSidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="fixed inset-0 bg-warm-900/60 dark:bg-warm-950/80 backdrop-blur-sm z-40 lg:hidden"
                            />
                        )}
                    </AnimatePresence>

                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block">
                        <ConversationSidebar
                            conversations={conversations}
                            activeConversation={activeConversation}
                            children={children}
                            selectedChildId={selectedChildId}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onSelectConversation={loadConversation}
                            onDeleteConversation={deleteConversation}
                            onRenameConversation={renameConversation}
                            onNewConversation={() => setShowChildSelector(true)}
                            onChildFilterChange={setSelectedChildId}
                            getChildName={getChildName}
                        />
                    </div>

                    {/* Mobile Sidebar */}
                    <AnimatePresence>
                        {isMobileSidebarOpen && (
                            <div className="lg:hidden">
                                <ConversationSidebar
                                    conversations={conversations}
                                    activeConversation={activeConversation}
                                    children={children}
                                    selectedChildId={selectedChildId}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    onSelectConversation={loadConversation}
                                    onDeleteConversation={deleteConversation}
                                    onRenameConversation={renameConversation}
                                    onNewConversation={() => setShowChildSelector(true)}
                                    onChildFilterChange={setSelectedChildId}
                                    getChildName={getChildName}
                                    isOpen={isMobileSidebarOpen}
                                    onClose={() => setIsMobileSidebarOpen(false)}
                                />
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-warm-50 to-white dark:from-warm-900 dark:to-warm-950">
                        {!activeConversation ? (
                            /* Welcome State */
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="w-24 h-24 mb-8 rounded-3xl bg-gradient-to-br from-primary-400 to-rose-400 flex items-center justify-center shadow-2xl shadow-primary-500/30"
                                >
                                    <Heart className="w-12 h-12 text-white" />
                                </motion.div>

                                <motion.h3
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-3xl font-bold text-warm-800 dark:text-warm-50 mb-3"
                                >
                                    How can I help today?
                                </motion.h3>

                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-warm-500 dark:text-warm-400 max-w-md mb-10"
                                >
                                    Choose a child to get personalized guidance and support tailored to their unique developmental stage.
                                </motion.p>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-wrap justify-center gap-3"
                                >
                                    {children.map(child => (
                                        <motion.button
                                            key={child.id}
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => startNewConversation(child.id)}
                                            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white dark:bg-warm-800 border-2 border-warm-200 dark:border-warm-700 hover:border-primary-300 dark:hover:border-primary-600 shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-900/50 dark:to-rose-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                                                {child.name[0]}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-warm-800 dark:text-warm-100">
                                                    {child.name}
                                                </div>
                                                <div className="text-xs text-warm-500 dark:text-warm-400">
                                                    Start new chat
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-warm-400" />
                                        </motion.button>
                                    ))}
                                </motion.div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="px-4 sm:px-6 py-4 border-b border-warm-100 dark:border-warm-800 bg-white/80 dark:bg-warm-900/80 backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setIsMobileSidebarOpen(true)}
                                                className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
                                            >
                                                <Menu className="w-5 h-5 text-warm-500" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveConversation(null);
                                                    setMessages([]);
                                                }}
                                                className="hidden lg:block p-2 -ml-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
                                            >
                                                <ArrowLeft className="w-5 h-5 text-warm-500" />
                                            </button>
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-rose-400 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                                <Sparkles className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-warm-800 dark:text-warm-50 line-clamp-1">
                                                    {activeConversation.title}
                                                </h3>
                                                <p className="text-sm text-warm-500 dark:text-warm-400 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                                    Chatting about {getChildName(activeConversation.child_id)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div
                                    ref={messagesContainerRef}
                                    className="flex-1 overflow-y-auto chat-scroll p-4 sm:p-6 space-y-6"
                                >
                                    {/* Empty state with suggested prompts */}
                                    {messages.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center justify-center min-h-[400px] py-8"
                                        >
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-50 to-rose-50 dark:from-primary-950/50 dark:to-rose-950/50 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-sm mb-6">
                                                <Sparkles className="w-4 h-4" />
                                                New conversation started
                                            </div>

                                            <p className="text-warm-600 dark:text-warm-400 text-center max-w-lg mb-8">
                                                I'm here to help with any parenting questions or concerns about{' '}
                                                <span className="font-semibold text-primary-600 dark:text-primary-400">
                                                    {getChildName(activeConversation.child_id)}
                                                </span>.
                                                Try one of these suggestions or type your own question below.
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                                {SUGGESTED_PROMPTS.map((suggestion, index) => (
                                                    <motion.button
                                                        key={index}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 * index }}
                                                        whileHover={{ scale: 1.02, y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleSuggestedPrompt(suggestion.prompt)}
                                                        className="group flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-warm-800/50 border border-warm-200 dark:border-warm-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg transition-all text-left"
                                                    >
                                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${suggestion.gradient} text-white shadow-lg`}>
                                                            <suggestion.icon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-warm-800 dark:text-warm-100 mb-0.5">
                                                                {suggestion.title}
                                                            </div>
                                                            <div className="text-xs text-warm-500 dark:text-warm-400 line-clamp-2">
                                                                {suggestion.prompt}
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-warm-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0 mt-1" />
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Exploration Mode UI */}
                                    {isExplorationMode && currentQuestion ? (
                                        <>
                                            <ExplorationProgress
                                                currentQuestion={currentQuestion.question_number}
                                                totalQuestions={10}
                                                phase={currentQuestion.question_type}
                                            />
                                            <div className="flex-1 flex items-center justify-center">
                                                <QuestionCard
                                                    question={currentQuestion.question}
                                                    questionNumber={currentQuestion.question_number}
                                                    questionType={currentQuestion.question_type}
                                                    onSubmit={submitExplorationAnswer}
                                                    isSubmitting={isSending}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Messages */}
                                            {messages.map((message, index) => (
                                                <MessageBubble
                                                    key={message.id}
                                                    message={message}
                                                    isLatestAssistant={
                                                        message.role === 'assistant' &&
                                                        index === messages.length - 1
                                                    }
                                                    isStreaming={isStreaming}
                                                    onCopy={() => { }}
                                                    onRegenerate={
                                                        message.role === 'assistant' && index === messages.length - 1
                                                            ? () => {
                                                                const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                                                                if (lastUserMsg) {
                                                                    setMessages(prev => prev.slice(0, -1));
                                                                    sendMessage(lastUserMsg.content);
                                                                }
                                                            }
                                                            : undefined
                                                    }
                                                    onFeedback={(type) => console.log(`Feedback: ${type} for message ${message.id}`)}
                                                />
                                            ))}

                                            {/* Typing Indicator */}
                                            <AnimatePresence>
                                                {isSending && <TypingIndicator />}
                                            </AnimatePresence>
                                        </>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area - hide during exploration */}
                                {!isExplorationMode && (
                                    <div className="p-4 sm:p-6 border-t border-warm-100 dark:border-warm-800 bg-white/80 dark:bg-warm-900/80 backdrop-blur-sm">
                                        <ChatInput
                                            value={inputMessage}
                                            onChange={setInputMessage}
                                            onSubmit={() => sendMessage()}
                                            disabled={isSending}
                                            placeholder={`Ask anything about ${getChildName(activeConversation.child_id)}...`}
                                        />
                                        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-warm-400 dark:text-warm-500">
                                            <Sparkles className="w-3 h-3" />
                                            <span>AI responses are for informational purposes. Consult professionals for medical advice.</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Child Selector Modal */}
            <AnimatePresence>
                {showChildSelector && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="absolute inset-0 bg-warm-900/60 dark:bg-warm-950/80 backdrop-blur-sm"
                            onClick={() => setShowChildSelector(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative"
                        >
                            <Card className="w-full max-w-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50">
                                        Start new conversation
                                    </h3>
                                    <button
                                        onClick={() => setShowChildSelector(false)}
                                        className="p-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-warm-500 dark:text-warm-400 text-sm mb-4">
                                    Which child would you like to discuss?
                                </p>
                                <div className="space-y-2">
                                    {children.map(child => (
                                        <motion.button
                                            key={child.id}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => startNewConversation(child.id)}
                                            className="w-full text-left p-4 rounded-2xl border-2 border-warm-200 dark:border-warm-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all flex items-center gap-3"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-900/50 dark:to-rose-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                                                {child.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-warm-700 dark:text-warm-200">
                                                    {child.name}
                                                </div>
                                                <div className="text-xs text-warm-500 dark:text-warm-400">
                                                    Click to start chatting
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-warm-400" />
                                        </motion.button>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setConversationToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Conversation"
                message="Are you sure you want to delete this conversation? This action cannot be undone."
                confirmText="Delete"
                isDangerous={true}
            />
        </Layout >
    );
};

export default ChatPage;
