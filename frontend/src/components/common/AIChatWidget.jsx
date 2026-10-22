import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  ChevronDown, 
  Clock, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { aiAPI } from '../../services/api';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '👋 Hello! I am your **SmartQueue AI Assistant**.\n\nAsk me anything about current wait times, ticket status, required documents, or counter locations!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'How long is the wait right now?',
    'What documents do I need?',
    'What services are available?',
    'Where is my ticket being served?'
  ]);

  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Load contextual suggestions from backend
  useEffect(() => {
    aiAPI.getSuggestions()
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setSuggestions(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Check active customer token from session if available
    let activeTokenId = null;
    try {
      const saved = sessionStorage.getItem('smartqueue_customer_token');
      if (saved) {
        const parsed = JSON.parse(saved);
        activeTokenId = parsed.id || parsed._id;
      }
    } catch {}

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await aiAPI.sendMessage(text, messages, activeTokenId);
      const replyText = res?.data?.reply || 'I could not process that request. Please try again.';

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        source: res?.data?.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: '⚠️ Unable to connect to the AI assistant service. Please check your network connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: 'Conversation reset. How can I assist you with your queue visit today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to format basic markdown-style text (**bold**, • bullets)
  const renderFormattedText = (text) => {
    return text.split('\n').map((line, idx) => {
      // Process bold formatting
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <p key={idx} className={line.startsWith('•') ? 'ml-2 my-0.5' : 'my-1'}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Chat Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-purple-600/30 hover:shadow-2xl hover:shadow-purple-600/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          aria-label="Open SmartQueue AI Assistant"
        >
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white"></span>
          </span>

          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="text-sm font-bold tracking-wide">Queue AI</span>
          </div>

          <span className="hidden sm:inline-block text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium backdrop-blur-xs">
            Unlimited
          </span>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[400px] h-[550px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between border-b border-purple-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">SmartQueue AI</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Live
                  </span>
                </div>
                <p className="text-xs text-purple-200/80">Queue Assistant & Ticket Helper</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Reset conversation"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1 pl-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Ask:</span>
            </span>
            {suggestions.slice(0, 3).map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200/80 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700 transition-colors cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200/90 text-slate-700 rounded-bl-xs'
                  }`}
                >
                  {renderFormattedText(msg.text)}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-fit text-slate-500 text-xs shadow-xs">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Checking live queue...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:bg-white border border-transparent focus-within:border-purple-300 transition-all">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about queue, wait times, documents..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-hidden py-1.5"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="p-2 rounded-xl bg-purple-600 text-white disabled:opacity-40 disabled:hover:bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-center px-1 mt-1.5 text-[10px] text-slate-400">
              <span>Unlimited Free AI Service</span>
              <span>Powered by SmartQueue Live Context</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
