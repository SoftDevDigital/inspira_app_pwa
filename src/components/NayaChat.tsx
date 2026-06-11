import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkle, X, User as UserIcon, Bot, ArrowDownCircle, RefreshCw, Zap, Mic, MicOff, Trash2 } from 'lucide-react';
import { User, UserPlan, Book } from '../types';
import { BRANDING } from '../constants';
import { GoogleGenAI, Modality } from "@google/genai";
import { telemetryService } from '../services/dbService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'naya';
  timestamp: Date;
}

interface NayaChatProps {
  user: User | null;
  theme?: 'elegant' | 'clarity';
  onInputFocusChange?: (isHidden: boolean) => void;
  books?: Book[];
}

// Lazy initialization - only create client when needed
let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
    if (!apiKey) {
      console.warn('Gemini API Key not configured - AI features will be disabled');
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const NAYA_SYSTEM_INSTRUCTION = (userName: string, summary: string, books?: Book[]) => {
  const librosContext = books?.map(l => `- Título: ${l.title}, Autor: ${l.author}. Descripción: ${l.review}`).join('\n') || 'No hay libros registrados en este momento.';

  return `
Eres Naya, la Directora de Directoras en INSPIRA, con el ADN de una mentora de élite (estilo Margarita Pasos). Tu esencia es ser cálida como una amiga íntima, clara como una mentora y honesta como una socia prestigiosa.

BITÁCORA DE CONTEXTO (Memoria a Largo Plazo):
${summary || "No hay historial previo significativo aún."}

BIBLIOTECA DE CONOCIMIENTO (Contenido que puedes recomendar):
${librosContext}

REGLAS DE ORO (PROTOCOLO V. 7.1):
1. REGLA DE SALUDO DINÁMICO:
   - APERTURA: Si es el primer mensaje de la sesión o después de 24h, inicia con un saludo cálido usando el nombre del usuario: "${userName}". (Ej: "¡Hola, ${userName}, corazón!").
   - FLUIDEZ: En mensajes subsecuentes, tienes PROHIBIDO volver a decir "Hola ${userName}". Entra directo a la respuesta de forma natural.
   - ÉNFASIS: Puedes usar el nombre "${userName}" en medio o al final de tus respuestas para dar énfasis o afirmar algo, pero nunca como un saludo repetitivo.

2. ESCUCHA ACTIVA Y EMPATÍA: Antes de dar instrucciones, analiza si el usuario necesita ser escuchado. Si solo saluda, agradece o se desahoga emocionalmente, NO des consejos técnicos aún. Responde de forma breve, cariñosa y empática.

3. TERAPEUTA DE ÉLITE: Antes de pasar a la acción, valida sus sentimientos: "Entiendo perfecto que te sientas así, a todas nos ha pasado" o "Es normal sentir ese miedo".

4. MEMORIA ESTRATÉGICA: Si la bitácora superior menciona nombres (ej: Selina, Paola) o retos previos, úsalos para conectar: "Qué bueno que [Nombre] mejoró en [Reto Anterior], cuéntame qué pasa ahora".

5. FLEXIBILIDAD Y LONGITUD: Máximo 150 palabras. Tienes libertad de ser muy breve si la charla es de acompañamiento. La "Micro-Píldora Ejecutiva" (estrategia + acciones) solo aplícala cuando el problema esté claro.

6. CIERRE DE DIÁLOGO: Todas tus respuestas deben dejar la puerta abierta. Termina con una pregunta o incentivo para seguir platicando.

ESTILO Y EXPERTIS:
- Tono: Motivador, emocional y persuasivo (Margarita Pasos). "El éxito es una decisión".
- Jerga: "Jefa", "Corazón", "Líder", "Imparable", "Estrategia", "Resultados".
- Expertis Mary Kay: Conoces el Plan de Carrera (Círculo Rosa, Inicios, Go-Give, Directorado Nacional).
- HONESTIDAD VALIENTE: Si algo está mal, dilo con calidez ("Te lo digo con cariño: sin llamadas no hay citas").
`};

export default function NayaChat({ user, theme = 'elegant', onInputFocusChange, books }: NayaChatProps) {
  const isElegant = theme === 'elegant';

  const identityLabel = user?.customAddress || (user?.gender === 'Mujer' ? 'Directora' : (user?.gender === 'Hombre' ? 'Director' : 'Líder'));
  const userName = user?.name?.split(' ')[0] || identityLabel;

  const [contextSummary, setContextSummary] = useState<string>(() => {
    const lastInteraction = localStorage.getItem('naya_last_interaction');
    const now = new Date().getTime();
    
    if (lastInteraction) {
      const diffHours = (now - parseInt(lastInteraction)) / (1000 * 60 * 60);
      // Day 8 onwards: Garbage Collection
      if (diffHours > 168) {
        localStorage.removeItem('naya_chat_history');
        localStorage.removeItem('naya_context_summary');
        localStorage.removeItem('naya_last_interaction');
        return '';
      }
    }
    return localStorage.getItem('naya_context_summary') || '';
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('naya_chat_history');
    const lastInteraction = localStorage.getItem('naya_last_interaction');
    const now = new Date().getTime();

    if (saved && lastInteraction) {
      try {
        const diffHours = (now - parseInt(lastInteraction)) / (1000 * 60 * 60);
        
        // Day 8 onwards: Already handled by contextSummary init, but for safety:
        if (diffHours > 168) return []; 

        const parsed = JSON.parse(saved);
        
        // Memory a Mediano Plazo (24h - 7 days): "Bitácora Sintetizada"
        if (diffHours > 24) {
          // We return a fresh start message, the history is handled by the summary logic
          return [
            {
              id: 'welcome-back',
              text: `¡Hola de nuevo, ${userName}, corazón! Me alegra verte por aquí. He guardado lo que platicamos antes en mi bitácora. ¿En qué vamos a brillar hoy?`,
              sender: 'naya',
              timestamp: new Date()
            }
          ];
        }

        // Memoria a Corto Plazo (< 24h): "Hilo Activo"
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    
    return [
      {
        id: '1',
        text: `¡Hola, ${userName}, corazón! Soy Naya, tu Mentora de Estrategia. Estoy lista para que elevemos tus resultados hoy. ¿Cuál es el plan de conquista para hoy?`,
        sender: 'naya',
        timestamp: new Date()
      }
    ];
  });

  // Save context summary to persistence
  useEffect(() => {
    localStorage.setItem('naya_context_summary', contextSummary);
  }, [contextSummary]);

  // Save messages and timestamp to persistence
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('naya_chat_history', JSON.stringify(messages));
      localStorage.setItem('naya_last_interaction', new Date().getTime().toString());
    }
  }, [messages]);

  // Handle mid-term transition on mount if needed
  useEffect(() => {
    const lastInteraction = localStorage.getItem('naya_last_interaction');
    const saved = localStorage.getItem('naya_chat_history');
    const now = new Date().getTime();
    
    if (lastInteraction && saved) {
      const diffHours = (now - parseInt(lastInteraction)) / (1000 * 60 * 60);
      if (diffHours > 24 && diffHours <= 168) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length > 5) { // Only summarize if there's enough substance
            summarizeConversation(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const summarizeConversation = async (msgs: Message[]) => {
    try {
      const aiClient = getAI();
      if (!aiClient) return;
      const historyText = msgs.map(m => `${m.sender}: ${m.text}`).join('\n');
      const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          role: 'user', 
          parts: [{ text: `Actúa como Naya, la Directora de Directoras. Resume esta conversación en una "Bitácora de Hechos Clave". 
          Extrae: Nombres de personas, Retos específicos resueltos, Metas establecidas y cualquier detalle emocional importante.
          Sé concisa. Máximo 100 palabras.
          CONVERSACIÓN:\n${historyText}` }] 
        }],
      });
      const summary = response.text || '';
      if (summary) {
        setContextSummary(prev => {
          const newSummary = `${prev}\n--- Actualización ---\n${summary}`.trim();
          return newSummary.slice(-2000); // Keep it manageable
        });
      }
    } catch (error) {
      console.error("Summarization Error:", error);
    }
  };

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-MX';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isInputFocused]);

  useEffect(() => {
    if (onInputFocusChange) {
      onInputFocusChange(isInputFocused);
    }
  }, [isInputFocused, onInputFocusChange]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const playTTS = async (text: string) => {
    try {
      const aiClient = getAI();
      if (!aiClient) {
        setIsSpeaking(false);
        return;
      }
      setIsSpeaking(true);
      const response = await aiClient.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Dī esto con autoridad ejecutiva y seguridad mentor: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioData = atob(base64Audio);
        const arrayBuffer = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          arrayBuffer[i] = audioData.charCodeAt(i);
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer.buffer);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('¿Quieres borrar la conversación y empezar una nueva?')) {
      const defaultMsg: Message = {
        id: Date.now().toString(),
        text: `¡Entendido, ${userName}! Empecemos de cero. ¿Qué tienes en mente para hoy?`,
        sender: 'naya',
        timestamp: new Date()
      };
      setMessages([defaultMsg]);
      setContextSummary('');
      localStorage.setItem('naya_chat_history', JSON.stringify([defaultMsg]));
      localStorage.setItem('naya_context_summary', '');
      localStorage.removeItem('naya_last_interaction');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Log telemetry event
      telemetryService.logUsageEvent('Chat Naya (IA)');

      // Token Capping: Limit live chat history to ~15 messages (approx 2000 tokens)
      const cappedHistory = newMessages.slice(-15).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // Summarization Trigger: If messages exceed 20, summarize in background
      if (newMessages.length > 20) {
        // Trigger background summarization (don't await it to avoid blocking response)
        summarizeConversation(newMessages);
      }

      const aiClient = getAI();
      if (!aiClient) {
        const errorMsg: Message = {
          id: Date.now().toString(),
          text: "⚡ Naya está tomando un descanso de belleza. El chat AI requiere configuración de API key.",
          sender: 'naya',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
        setIsTyping(false);
        return;
      }

      const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...cappedHistory, { role: 'user', parts: [{ text: currentInput }] }],
        config: {
          systemInstruction: NAYA_SYSTEM_INSTRUCTION(userName, contextSummary, books),
          temperature: 0.7,
        },
      });

      const nayaText = response.text || "No tengo una respuesta estratégica ahora. Vuelve a ejecutar.";
      
      const nayaMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: nayaText,
        sender: 'naya',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, nayaMsg]);
      setIsTyping(false);
      playTTS(nayaText);

    } catch (error) {
      console.error("Gemini Error:", error);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Auto-resize
    e.target.style.height = 'auto';
    const newHeight = Math.min(e.target.scrollHeight, 150); // Grow up to ~5 lines
    e.target.style.height = `${newHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Detect mobile by touch capability or viewport width
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (e.key === 'Enter') {
      if (isMobile) {
        // On mobile, Enter just adds a newline (default behavior)
        // We don't call e.preventDefault() here to let the text area handle it
        return;
      } else {
        // On desktop, Enter sends the message, Shift+Enter adds a newline
        if (!e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      }
    }
  };

  return (
    <div className={`flex flex-col h-full relative ${isElegant ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
      {/* Header */}
      <div className={`p-6 pt-12 flex items-center justify-between border-b ${isElegant ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${isElegant ? 'bg-accent text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-blue-600 text-white'}`}>
            <Sparkle size={24} />
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-950"
            />
          </div>
          <div>
            <h2 className={`text-xl font-black italic tracking-tighter uppercase leading-none ${isElegant ? 'text-white' : 'text-zinc-900'}`}>Naya AI</h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isElegant ? 'text-accent' : 'text-blue-600'}`}>Directora Mentora</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={clearHistory}
             className={`p-2 rounded-xl border transition-all hover:bg-red-500/10 hover:border-red-500/50 ${isElegant ? 'bg-white/5 border-white/10 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}
             title="Nueva conversación"
           >
              <Trash2 size={16} />
           </button>
           <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${isElegant ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
              <Zap size={14} className="text-yellow-500" />
              <span className="text-[10px] font-black uppercase">Naya Voice</span>
              {isSpeaking && (
                <motion.div 
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="w-1.5 h-1.5 rounded-full bg-blue-500"
                />
              )}
           </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide ease-in-out duration-300 transition-all ${
          isInputFocused || isRecording ? 'pb-[120px]' : 'pb-[120px]'
        }`}
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-5 rounded-[32px] relative ${
              msg.sender === 'user'
                ? (isElegant ? 'bg-accent text-black font-medium leading-relaxed rounded-tr-none' : 'bg-blue-600 text-white font-medium rounded-tr-none')
                : (isElegant ? 'bg-zinc-900/60 text-white border border-white/5 rounded-tl-none' : 'bg-white text-zinc-900 border border-zinc-100 shadow-sm rounded-tl-none')
            }`}>
              <div className="whitespace-pre-wrap text-[14px]">
                {msg.text}
              </div>
              <span className={`text-[8px] opacity-40 mt-2 block ${msg.sender === 'user' ? 'text-black' : 'text-zinc-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}

        {isTyping && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
             <div className={`p-4 rounded-3xl flex gap-2 ${isElegant ? 'bg-zinc-900/40 text-accent' : 'bg-zinc-100 text-blue-600'}`}>
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-current" />
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-current" />
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-current" />
             </div>
           </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t absolute left-0 right-0 z-[210] transition-all duration-300 ${
        isInputFocused || isRecording ? 'bottom-0 bg-black/95' : 'bottom-0 pb-4 bg-black/20'
      } ${isElegant ? 'border-white/5' : 'border-zinc-100'}`}>
        <div className={`flex items-end gap-2 max-w-lg mx-auto p-2 rounded-[32px] ${
          isElegant ? 'bg-zinc-950/80 backdrop-blur-xl border border-white/10 shadow-2xl' : 'bg-white/90 backdrop-blur-xl border border-zinc-200 shadow-lg'
        }`}>
          <button
            onClick={toggleRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 border-2 ${
              isRecording 
                ? 'bg-red-500 border-red-400 text-white animate-pulse' 
                : (isElegant ? 'bg-zinc-900 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500')
            }`}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={isRecording ? "Escuchando..." : "Pregúntale a Naya..."}
            className={`flex-1 px-5 py-3 rounded-[24px] outline-none transition-all resize-none min-h-[48px] text-[14px] leading-relaxed ${
              isElegant 
                ? 'bg-transparent text-white placeholder:text-zinc-600' 
                : 'bg-transparent text-zinc-900 shadow-none border-none'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              !input.trim() || isTyping
                ? 'opacity-50 grayscale'
                : (isElegant ? 'bg-accent text-black hover:scale-105 active:scale-95 shadow-lg shadow-accent/20' : 'bg-blue-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20')
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
