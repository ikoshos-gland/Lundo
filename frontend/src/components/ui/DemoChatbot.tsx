import React from 'react';
import {
    User,
    Sparkles,
    Mic,
    ArrowUp,
    Brain,
    ListTodo,
} from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Pre-populated demo messages for aesthetic display
const demoMessages: Message[] = [
    {
        role: 'user',
        content: "My 6-year-old has been having trouble sleeping lately. She says she's scared of the dark and keeps coming to our room at night.",
    },
    {
        role: 'assistant',
        content: "That's completely normal at her age! Around 5-7 years old, children develop more vivid imaginations which can make bedtime fears more intense. Here are some gentle strategies:\n\n• Create a calming bedtime routine with dim lights\n• Use a nightlight with warm colors\n• Give her a \"brave buddy\" stuffed animal\n• Practice relaxation breathing together\n\nWould you like me to elaborate on any of these approaches?",
    },
    {
        role: 'user',
        content: "The nightlight sounds like a good idea. She also mentioned monsters under the bed - should I play along or tell her monsters aren't real?",
    },
    {
        role: 'assistant',
        content: "Great question! Rather than dismissing her fears or fully playing along, try validation + empowerment:\n\n✨ Acknowledge: \"I understand that feels scary to you.\"\n✨ Empower: \"Let's check together and make this a safe space.\"\n✨ Create a ritual: \"Monster spray\" (lavender water) can give her a sense of control.\n\nThis approach respects her feelings while building confidence. Children this age are learning to distinguish fantasy from reality - your calm presence is key.",
    },
];

const selectedAgentDisplay = 'Sleep Recovery Expert';

const DemoChatbot: React.FC = () => {
    const [inputValue] = React.useState('');

    return (
        <div className="w-full max-w-6xl mx-auto relative z-10 animate-float">
            {/* App Container */}
            <div className="bg-warm-50 dark:bg-warm-900 rounded-5xl shadow-lg border border-white dark:border-warm-800 ring-1 ring-warm-200 dark:ring-warm-800 overflow-hidden flex flex-col md:flex-row aspect-[16/10] md:h-[600px] transition-colors duration-300">

                {/* Left Sidebar */}
                <div className="hidden md:flex w-72 bg-warm-50 dark:bg-warm-950 border-r border-warm-100 dark:border-warm-800 flex-col p-6 transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-warm-800 flex items-center justify-center text-primary-600">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-50">
                                Sarah (Parent)
                            </h3>
                            <p className="text-xs text-warm-400">Premium Plan</p>
                        </div>
                    </div>

                    <div className="space-y-1 mb-8">
                        <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3 px-2">
                            Active Profiles
                        </p>
                        <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-warm-800 text-primary-600 dark:text-primary-400 rounded-2xl transition-all shadow-sm ring-1 ring-primary-100 dark:ring-warm-700">
                            <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-[10px] font-bold">E</div>
                            <span className="text-sm font-medium">Emma (Age 6)</span>
                            <span className="ml-auto w-2 h-2 rounded-full bg-primary-500"></span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="bg-warm-100 dark:bg-warm-800 p-4 rounded-3xl transition-colors duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-warm-600 dark:text-warm-400">
                                    Session Progress
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                            </div>
                            <div className="w-full bg-warm-200 dark:bg-warm-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full w-[70%] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chat Window */}
                <div className="flex-1 flex flex-col bg-white dark:bg-warm-950 transition-colors duration-300">
                    {/* Chat Header */}
                    <div className="h-20 border-b border-warm-100 dark:border-warm-800 flex items-center justify-between px-8 bg-white/80 dark:bg-warm-950/80 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-warm-200 dark:bg-warm-800 overflow-hidden">
                                <img
                                    src="https://api.dicebear.com/7.x/micah/svg?seed=Emma&backgroundColor=e7e5e4"
                                    alt="Child"
                                    className="w-full h-full opacity-90"
                                />
                            </div>
                            <div>
                                <h2 className="text-warm-800 dark:text-warm-50 font-semibold text-sm">
                                    Sleep Support Session
                                </h2>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-xs text-warm-500 dark:text-warm-400">
                                        Expert Available
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Agent Selector (display only) */}
                            <select
                                disabled
                                className="text-xs border border-warm-200 dark:border-warm-700 rounded-lg px-3 py-1.5 bg-white dark:bg-warm-900 text-warm-800 dark:text-warm-50 cursor-not-allowed opacity-75"
                                defaultValue="sleep-recovery"
                            >
                                <option value="sleep-recovery">Sleep Recovery</option>
                                <option value="routine-architect">Routine Architect</option>
                                <option value="behavior-guide">Behavior Guide</option>
                            </select>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 chat-scroll bg-white dark:bg-warm-950 transition-colors duration-300">
                        {demoMessages.map((msg, idx) => (
                            <div key={idx}>
                                {msg.role === 'user' ? (
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-warm-200 dark:bg-warm-800 flex-shrink-0 mt-auto overflow-hidden">
                                            <img
                                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Parent&backgroundColor=e7e5e4"
                                                alt="Parent"
                                            />
                                        </div>
                                        <div className="max-w-[80%]">
                                            <div className="bg-warm-100 dark:bg-warm-900 dark:border dark:border-warm-800 p-5 rounded-3xl rounded-bl-sm text-warm-700 dark:text-warm-300 text-sm leading-relaxed shadow-sm">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-row-reverse gap-4">
                                        <div className="w-8 h-8 rounded-full bg-primary-600 flex-shrink-0 mt-auto flex items-center justify-center text-white">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div className="max-w-[80%]">
                                            <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 p-5 rounded-3xl rounded-br-sm text-warm-700 dark:text-warm-200 text-sm leading-relaxed shadow-sm whitespace-pre-line">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing indicator (static animation) */}
                        <div className="flex flex-row-reverse gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex-shrink-0 mt-auto flex items-center justify-center text-white">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                            </div>
                            <div className="max-w-[80%]">
                                <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 p-5 rounded-3xl rounded-br-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input Area (disabled) */}
                    <div className="border-t border-warm-100 dark:border-warm-800 p-6 bg-white dark:bg-warm-950 transition-colors duration-300">
                        <div className="flex items-end gap-3">
                            <div className="flex-1 bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-3xl px-6 py-4 flex items-center gap-4 opacity-75">
                                <input
                                    type="text"
                                    value={inputValue}
                                    placeholder="Talk to your expert..."
                                    disabled
                                    className="flex-1 bg-transparent outline-none text-warm-800 dark:text-warm-50 placeholder:text-warm-400 text-sm cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    disabled
                                    className="text-warm-400 cursor-not-allowed"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                disabled
                                className="w-12 h-12 rounded-full bg-warm-200 dark:bg-warm-800 text-warm-400 flex items-center justify-center cursor-not-allowed"
                            >
                                <ArrowUp className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="hidden lg:flex w-72 bg-warm-50 dark:bg-warm-950 border-l border-warm-100 dark:border-warm-800 flex-col p-6 transition-colors duration-300">
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-warm-800 p-4 rounded-2xl transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <Brain className="w-4 h-4 text-primary-600" />
                                <h4 className="text-xs font-semibold text-warm-800 dark:text-warm-50">Active Agent</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs text-warm-500 dark:text-warm-400">
                                    {selectedAgentDisplay}
                                </span>
                            </div>
                        </div>

                        <div className="bg-primary-50 dark:bg-primary-950/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-900/30 transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <ListTodo className="w-4 h-4 text-primary-600" />
                                <h4 className="text-xs font-bold text-warm-700 dark:text-primary-300">Session Info</h4>
                            </div>
                            <div className="text-xs text-warm-500 dark:text-warm-400">
                                <p className="mb-1">Messages: {demoMessages.length}</p>
                                <p className="mb-1">Topic: Sleep Issues</p>
                                <p>Status: Demo Mode</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoChatbot;
