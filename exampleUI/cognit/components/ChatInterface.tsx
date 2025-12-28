import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Phone,
  MoreHorizontal,
  Sparkles,
  Activity,
  Mic,
  ArrowUp,
  Brain,
  ListTodo,
  Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

const ChatInterface: React.FC = () => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState<string>(generateSessionId());
  const [selectedAgent, setSelectedAgent] = useState<string>('reality-checker');
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = {
    en: {
      profileName: "Sarah (Solo Mom)",
      plan: "Premium Plan",
      activeProfiles: "Active Profiles",
      mentalLoad: "Mental Load Status",
      managing: "Managing",
      councilName: "The Village Council",
      expertsActive: "Developmental & Emotional Experts Active",
      placeholder: "Talk to your village...",
      selectAgent: "Select Agent",
      realityChecker: "The Reality Checker",
      routineArchitect: "The Routine Architect",
      guiltDissolver: "The Guilt Dissolver",
      sleepRecovery: "Sleep Recovery",
      homeworkHelper: "Homework Helper",
      transitionTamer: "Transition Tamer"
    },
    tr: {
      profileName: "Selin (Bekar Anne)",
      plan: "Premium Plan",
      activeProfiles: "Aktif Profiller",
      mentalLoad: "Zihinsel Yük Durumu",
      managing: "Yönetiliyor",
      councilName: "Köy Meclisi",
      expertsActive: "Gelişimsel & Duygusal Uzmanlar Aktif",
      placeholder: "Köyünle konuş...",
      selectAgent: "Ajan Seç",
      realityChecker: "Gerçeklik Kontrolcüsü",
      routineArchitect: "Rutin Mimarı",
      guiltDissolver: "Suçluluk Giderici",
      sleepRecovery: "Uyku Kurtarıcı",
      homeworkHelper: "Ödev Yardımcısı",
      transitionTamer: "Geçiş Ustası"
    }
  };

  const text = t[language];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    // Add user message to UI immediately
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Make API request
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          agentId: selectedAgent,
          message: userMessage,
          context: {
            childAge: 6,
            language
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'content_block_delta') {
                  assistantMessage = data.delta;

                  // Update or add assistant message
                  setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg?.role === 'assistant') {
                      return [...prev.slice(0, -1), { role: 'assistant', content: assistantMessage }];
                    } else {
                      return [...prev, { role: 'assistant', content: assistantMessage }];
                    }
                  });
                } else if (data.type === 'message_complete') {
                  setIsLoading(false);
                }
              } catch (e) {
                // Skip malformed JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: language === 'tr'
          ? 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
          : 'Sorry, an error occurred. Please try again.'
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto relative z-10 animate-float">
      {/* App Container */}
      <div className="bg-[#fbfaf9] dark:bg-[#1c1917] rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(87,83,78,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white dark:border-[#292524] ring-1 ring-[#e7e5e4] dark:ring-[#292524] overflow-hidden flex flex-col md:flex-row aspect-[16/10] md:h-[650px] transition-colors duration-300">

        {/* Left Sidebar */}
        <div className="hidden md:flex w-72 bg-[#fdfcfb] dark:bg-[#171514] border-r border-[#f0ebe6] dark:border-[#292524] flex-col p-6 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-full bg-[#f5f0e6] dark:bg-[#292524] flex items-center justify-center text-[#d97757]">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-[#292524] dark:text-[#fafaf9]">
                {text.profileName}
              </h3>
              <p className="text-xs text-[#a8a29e]">{text.plan}</p>
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <p className="text-xs font-semibold text-[#a8a29e] uppercase tracking-wider mb-3 px-2">
              {text.activeProfiles}
            </p>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 bg-[#fff7ed] dark:bg-[#292524] text-[#d97757] dark:text-[#fdba74] rounded-2xl transition-all shadow-sm ring-1 ring-[#ffedd5] dark:ring-[#44403c]"
            >
              <div className="w-6 h-6 rounded-full bg-[#fb923c]/20 flex items-center justify-center text-[10px] font-bold">L</div>
              <span className="text-sm font-medium">Leo (Age 6)</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-[#fb923c]"></span>
            </a>
          </div>

          <div className="mt-auto">
            <div className="bg-[#f5f5f4] dark:bg-[#292524] p-4 rounded-3xl transition-colors duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#57534e] dark:text-[#a8a29e]">
                  {text.mentalLoad}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{text.managing}</span>
              </div>
              <div className="w-full bg-[#e7e5e4] dark:bg-[#44403c] h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[70%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Window */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0c0a09] transition-colors duration-300">
          {/* Chat Header */}
          <div className="h-20 border-b border-[#f5f5f4] dark:border-[#292524] flex items-center justify-between px-8 bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#e7e5e4] dark:bg-[#292524] overflow-hidden">
                <img
                  src="https://api.dicebear.com/7.x/micah/svg?seed=Leo&backgroundColor=e7e5e4"
                  alt="Child"
                  className="w-full h-full opacity-90"
                />
              </div>
              <div>
                <h2 className="text-[#292524] dark:text-[#fafaf9] font-semibold text-sm">
                  {text.councilName}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-[#78716c] dark:text-[#a8a29e]">
                    {text.expertsActive}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Agent Selector */}
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="text-xs border border-[#e7e5e4] dark:border-[#292524] rounded-lg px-3 py-1.5 bg-white dark:bg-[#1c1917] text-[#292524] dark:text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#d97757]"
              >
                <option value="reality-checker">{text.realityChecker}</option>
                <option value="routine-architect">{text.routineArchitect}</option>
                <option value="guilt-dissolver">{text.guiltDissolver}</option>
                <option value="sleep-recovery">{text.sleepRecovery}</option>
                <option value="homework-helper">{text.homeworkHelper}</option>
                <option value="transition-tamer">{text.transitionTamer}</option>
              </select>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 chat-scroll bg-[#ffffff] dark:bg-[#0c0a09] transition-colors duration-300">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-[#a8a29e]">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    {language === 'tr' ? 'Köyünüzle konuşmaya başlayın...' : 'Start talking to your village...'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    {msg.role === 'user' ? (
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#e7e5e4] dark:bg-[#292524] flex-shrink-0 mt-auto overflow-hidden">
                          <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mom&backgroundColor=e7e5e4"
                            alt="Parent"
                          />
                        </div>
                        <div className="max-w-[80%]">
                          <div className="bg-[#f5f5f4] dark:bg-[#1c1917] dark:border dark:border-[#292524] p-5 rounded-3xl rounded-bl-sm text-[#44403c] dark:text-[#d6d3d1] text-sm leading-relaxed shadow-sm">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-row-reverse gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#d97757] flex-shrink-0 mt-auto flex items-center justify-center text-white">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="max-w-[80%]">
                          <div className="bg-[#fff7ed] dark:bg-[#431407]/20 border border-[#ffedd5] dark:border-[#7c2d12]/30 p-5 rounded-3xl rounded-br-sm text-[#44403c] dark:text-[#e7e5e4] text-sm leading-relaxed shadow-sm">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex flex-row-reverse gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#d97757] flex-shrink-0 mt-auto flex items-center justify-center text-white">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="max-w-[80%]">
                      <div className="bg-[#fff7ed] dark:bg-[#431407]/20 border border-[#ffedd5] dark:border-[#7c2d12]/30 p-5 rounded-3xl rounded-br-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-[#d97757] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-[#d97757] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-[#d97757] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-[#f5f5f4] dark:border-[#292524] p-6 bg-white dark:bg-[#0c0a09] transition-colors duration-300">
            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
              <div className="flex-1 bg-[#fafaf9] dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] rounded-3xl px-6 py-4 flex items-center gap-4 focus-within:ring-2 focus-within:ring-[#d97757]/20 transition-all">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={text.placeholder}
                  disabled={isLoading}
                  className="flex-1 bg-transparent outline-none text-[#292524] dark:text-[#fafaf9] placeholder:text-[#a8a29e] text-sm"
                />
                <button
                  type="button"
                  className="text-[#a8a29e] hover:text-[#d97757] transition-colors"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-12 h-12 rounded-full bg-[#d97757] hover:bg-[#c66847] disabled:bg-[#e7e5e4] dark:disabled:bg-[#292524] text-white flex items-center justify-center transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar - Hidden on small/medium screens */}
        <div className="hidden lg:flex w-72 bg-[#fdfcfb] dark:bg-[#171514] border-l border-[#f0ebe6] dark:border-[#292524] flex-col p-6 transition-colors duration-300">
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#292524] p-4 rounded-2xl transition-colors duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-[#d97757]" />
                <h4 className="text-xs font-semibold text-[#292524] dark:text-[#fafaf9]">Active Agent</h4>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-[#78716c] dark:text-[#a8a29e]">
                  {selectedAgent === 'reality-checker' && text.realityChecker}
                  {selectedAgent === 'routine-architect' && text.routineArchitect}
                  {selectedAgent === 'guilt-dissolver' && text.guiltDissolver}
                  {selectedAgent === 'sleep-recovery' && text.sleepRecovery}
                  {selectedAgent === 'homework-helper' && text.homeworkHelper}
                  {selectedAgent === 'transition-tamer' && text.transitionTamer}
                </span>
              </div>
            </div>

            <div className="bg-[#fff7ed] dark:bg-[#431407]/10 p-4 rounded-2xl border border-[#ffedd5] dark:border-[#7c2d12]/30 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-3">
                <ListTodo className="w-4 h-4 text-[#d97757]" />
                <h4 className="text-xs font-bold text-[#44403c] dark:text-[#fde68a]">Session Info</h4>
              </div>
              <div className="text-xs text-[#78716c] dark:text-[#a8a29e]">
                <p className="mb-1">Messages: {messages.length}</p>
                <p>Language: {language.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
