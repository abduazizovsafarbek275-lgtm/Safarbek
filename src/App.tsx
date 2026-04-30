/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { TerminalSquare, Send, Code2, Zap, Settings, Command, Copy, Wand2, BookOpen, Sparkles } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Create a persistent chat session to maintain context
// We initialize it lazily or recreate when needed
let chatSession = ai.chats.create({
  model: 'gemini-3.1-pro-preview',
  config: {
    systemInstruction: `You are ProCode AI, a professional coding assistant. Your primary purpose is to write high-quality, production-ready code. You should advise on best practices, algorithms, and data structures. You must proactively analyze any code provided to you, identifing flaws, vulnerabilities, or performance issues, and suggest concrete improvements. Communicate in a highly professional, expert tone. Use markdown and syntax highlighting. Answer in the language the user speaks.`,
  }
});

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isStreaming?: boolean;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'ai',
      text: 'Salom! Men sizning professional AI kodlash yordamchisingizman. Dasturlash bo\'yicha qanday yordam kerak? Kod yozish, tahlil qilish yoki maslahat berishim mumkin.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', text: '', isStreaming: true }]);

    try {
      const streamResponse = await chatSession.sendMessageStream({ message: userMessage.text });
      
      let fullText = '';
      for await (const chunk of streamResponse) {
        fullText += chunk.text;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: fullText } : msg
        ));
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, text: 'Kechirasiz, xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.' } : msg
      ));
    } finally {
      setIsTyping(false);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Optional: add CMD+K or other shortcuts here
  };

  return (
    <div className="w-full h-screen bg-[#0A0B0E] text-slate-200 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/50 bg-[#0F1115] flex flex-col flex-shrink-0 hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TerminalSquare className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">CORE-AI <span className="text-blue-500">PRO</span></h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-2 mb-2">Recent Sessions</p>
            <div className="p-2 bg-slate-800/50 rounded-md text-sm border border-slate-700/50 text-white cursor-pointer">Joriy Sessiya</div>
            <div className="p-2 hover:bg-slate-800/30 rounded-md text-sm text-slate-400 transition-colors cursor-pointer">React komponent yozish</div>
            <div className="p-2 hover:bg-slate-800/30 rounded-md text-sm text-slate-400 transition-colors cursor-pointer">Algoritmni optimallashtirish</div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-2 mb-2">Workspace</p>
            <div className="p-2 hover:bg-slate-800/30 rounded-md text-sm text-slate-400 flex justify-between cursor-pointer">
              <span>Snippets</span>
              <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded">12</span>
            </div>
            <div className="p-2 hover:bg-slate-800/30 rounded-md text-sm text-slate-400 cursor-pointer">Templates</div>
          </div>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 bg-blue-600/10 rounded-xl border border-blue-500/20">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-xs text-blue-400 font-bold">DEV</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Developer</p>
              <p className="text-[10px] text-blue-400">Pro Subscription</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-[#0A0B0E]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="md:hidden font-bold text-white">CORE-AI</span>
              <span className="hidden md:inline">Project:</span>
              <span className="text-white font-medium">New Project</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 hidden md:flex">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Model: Gemini 3.1 Pro
            </span>
            <button className="p-2 md:px-4 md:py-1.5 bg-slate-800 rounded-md text-xs font-medium border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Settings</span>
            </button>
          </div>
        </header>

        {/* Chat/Code View Container */}
        <div className="flex-1 flex p-4 md:p-6 gap-6 overflow-hidden">
          {/* AI Interaction */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex-1 bg-slate-900/30 rounded-2xl border border-slate-800 p-4 md:p-6 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-4">
                    {msg.role === 'user' ? (
                      <>
                        <div className="w-8 h-8 bg-slate-700 rounded flex-shrink-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">ME</span>
                        </div>
                        <div className="space-y-1 w-full min-w-0">
                          <p className="text-xs text-slate-500 font-medium">Siz</p>
                          <div className="text-sm text-slate-300 bg-slate-800/40 p-3 md:p-4 rounded-lg border border-slate-700/30 leading-relaxed font-sans whitespace-pre-wrap">
                            {msg.text}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-blue-600 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {msg.isStreaming && !msg.text ? (
                            <Zap className="w-4 h-4 text-white animate-pulse" />
                          ) : (
                            <Code2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="space-y-1 w-full min-w-0">
                          <p className="text-xs text-blue-400 font-medium">Core-AI Response</p>
                          <div className="text-sm text-slate-300 leading-relaxed prose prose-invert prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-slate-700/50 prose-pre:p-0 prose-pre:shadow-2xl max-w-none">
                            {msg.text === '' && msg.isStreaming ? (
                               <div className="flex space-x-1 items-center h-6">
                                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                               </div>
                            ) : (
                               <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return !inline && match ? (
                                        <div className="rounded-xl overflow-hidden my-4">
                                          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/50">
                                            <span className="text-[11px] font-mono text-slate-400">{match[1]}</span>
                                          </div>
                                          <SyntaxHighlighter
                                            {...props}
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                                            codeTagProps={{ className: 'text-[13px] font-mono leading-relaxed' }}
                                          >
                                            {String(children).replace(/\n$/, '')}
                                          </SyntaxHighlighter>
                                        </div>
                                      ) : (
                                        <code {...props} className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded font-mono text-xs">
                                          {children}
                                        </code>
                                      );
                                    }
                                  }}
                                >
                                  {msg.text}
                                </ReactMarkdown>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <form onSubmit={handleSubmit} className="relative flex items-center bg-[#16191F] border border-slate-700/50 rounded-xl px-2 py-2 shadow-xl">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  placeholder="Keyingi vazifani buyuring... (masalan: React uchun qanday auth flow qilay?)" 
                  className="bg-transparent border-none outline-none flex-1 px-3 text-sm text-white placeholder-slate-500 disabled:opacity-50"
                />
                <div className="flex items-center gap-2">
                  <kbd className="hidden md:flex px-2 py-1 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-500 items-center">
                    <Command className="w-3 h-3 mr-1" /> K
                  </kbd>
                  <button 
                    disabled={!input.trim() || isTyping}
                    type="submit"
                    className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-500 transition disabled:opacity-50 disabled:hover:bg-blue-600 cursor-pointer disabled:cursor-default"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Utility Bar */}
          <div className="w-64 space-y-6 hidden lg:block shrink-0 overflow-y-auto">
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                Action Hub
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 bg-slate-800 rounded-lg text-xs hover:bg-slate-700 flex items-center justify-between transition-colors">
                  <span className="flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Copy Last Code</span>
                  <span className="text-slate-500">⌘C</span>
                </button>
                <button className="w-full text-left px-3 py-2 bg-slate-800 rounded-lg text-xs hover:bg-slate-700 flex items-center justify-between transition-colors group">
                  <span className="flex items-center gap-2 text-slate-300 group-hover:text-white"><Wand2 className="w-3.5 h-3.5" /> Refactor with AI</span>
                  <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">NEW</span>
                </button>
                <button className="w-full text-left px-3 py-2 bg-slate-800 rounded-lg text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> Explain Logic
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-500"></div>
              <h3 className="text-xs font-bold text-blue-400 mb-4 uppercase tracking-wider text-center relative z-10 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Insights
              </h3>
              <div className="space-y-3 relative z-10">
                <div className="bg-black/40 p-2.5 rounded border border-blue-500/10 backdrop-blur-sm transition-colors hover:border-blue-500/30">
                  <p className="text-[10px] text-slate-400 mb-1">Code Quality</p>
                  <p className="text-xs font-bold text-white uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Production Ready
                  </p>
                </div>
                <div className="bg-black/40 p-2.5 rounded border border-blue-500/10 backdrop-blur-sm transition-colors hover:border-blue-500/30">
                  <p className="text-[10px] text-slate-400 mb-1">Security Score</p>
                  <p className="text-xs font-bold text-emerald-400 uppercase">98 / 100</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(30, 41, 59, 1);
        }
      `}} />
    </div>
  );
}

