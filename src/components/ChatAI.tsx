/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, UserPlan } from '../types';
import { chatWithAI } from '../services/geminiService';

interface ChatAIProps {
  userPlan: UserPlan;
}

export default function ChatAI({ userPlan }: ChatAIProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '¡Hola! Soy Naya, tu Directora Nacional Virtual. Estás en una empresa maravillosa y estoy aquí para asegurar que lleves tu negocio al siguiente nivel con INSPIRA. ¿Qué reto vamos a conquistar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isRestricted = userPlan === 'Gratis';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isRestricted) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const response = await chatWithAI([...messages, userMessage]);
    setMessages(prev => [...prev, { role: 'model', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-bg-deep pb-28">
      <div className="p-6 border-b border-border glass-panel">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-black shadow-lg shadow-accent/20">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main">Directora Naya</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-text-dim font-bold uppercase tracking-wider">En línea</span>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-bg-hover text-text-dim' : 'bg-accent text-black'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-accent text-black rounded-tr-none shadow-lg shadow-accent/10' 
                  : 'bg-bg-card text-text-main rounded-tl-none border border-border'
              }`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-bg-card p-4 rounded-2xl rounded-tl-none border border-border">
                <Loader2 size={18} className="animate-spin text-accent" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 glass-panel border-t border-border">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isRestricted}
            placeholder={isRestricted ? "Acceso exclusivo para suscriptoras" : "Escribe tu duda aquí..."}
            className={`w-full bg-bg-hover border border-border rounded-full py-4 pl-6 pr-14 text-sm text-text-main focus:outline-none focus:border-accent transition-colors placeholder:text-text-dim ${isRestricted ? 'cursor-not-allowed opacity-50' : ''}`}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isRestricted}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg shadow-accent/20 ${isRestricted ? 'cursor-not-allowed' : ''}`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
