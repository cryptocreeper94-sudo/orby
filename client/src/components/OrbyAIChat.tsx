import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Volume2, VolumeX, Loader2, Sparkles, BookOpen, Mic, MicOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { OrbyGlossary } from './OrbyHelp';
import orbyImg from '@assets/generated_images/orby_commander_nobg.png';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  
  if (!response.ok) {
    throw new Error('Failed to get response');
  }
  
  const data = await response.json();
  return data.response;
}

function speakText(text: string, onEnd?: () => void) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Google') || 
      v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    if (onEnd) {
      utterance.onend = onEnd;
    }
    
    window.speechSynthesis.speak(utterance);
  }
}

function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function OrbyAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Orby, your stadium operations assistant. How can I help you today? Ask me about deliveries, inventory, roles, or anything else!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showVoiceDisclaimer, setShowVoiceDisclaimer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const hasVoiceSupport = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = () => {
    if (!hasVoiceSupport) return;
    
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      if (finalTranscript) {
        setInputValue(prev => prev + finalTranscript);
      } else if (interimTranscript) {
        setInputValue(interimTranscript);
      }
    };
    
    recognition.onerror = () => {
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleVoiceMode = () => {
    if (!voiceEnabled) {
      setShowVoiceDisclaimer(true);
    } else {
      setVoiceEnabled(false);
      stopListening();
    }
  };

  const acceptVoiceDisclaimer = () => {
    setVoiceEnabled(true);
    setShowVoiceDisclaimer(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const kbHeight = windowHeight - viewportHeight;
        setKeyboardHeight(kbHeight > 50 ? kbHeight : 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [isOpen]);

  const chatMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (response) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again or ask your supervisor for help.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSpeak = (messageId: string, text: string) => {
    if (speakingId === messageId) {
      stopSpeaking();
      setSpeakingId(null);
    } else {
      stopSpeaking();
      setSpeakingId(messageId);
      speakText(text, () => setSpeakingId(null));
    }
  };

  const quickQuestions = [
    "How do I request a delivery?",
    "What's the count process?",
    "Who do I call for help?"
  ];

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-4 left-4 z-50"
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-20 w-20 flex items-center justify-center"
          data-testid="floating-orby-ai-button"
        >
          <img 
            src={orbyImg} 
            alt="Orby AI" 
            className="h-20 w-20 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
          />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => {
                stopSpeaking();
                setIsOpen(false);
              }}
            />
            
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              style={{ 
                bottom: keyboardHeight > 0 ? `${keyboardHeight + 8}px` : '16px',
                maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight + 80}px)` : undefined
              }}
              className="fixed inset-x-4 top-16 md:inset-auto md:bottom-8 md:left-8 md:w-96 md:h-[600px] md:max-h-[80vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 z-50 flex flex-col overflow-hidden"
              data-testid="orby-ai-chat-modal"
            >
              <div className="p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-teal-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 overflow-hidden">
                        <img 
                          src={orbyImg} 
                          alt="Orby" 
                          className="h-10 w-10 object-contain"
                        />
                      </div>
                      <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Orby AI</h3>
                      <p className="text-xs text-cyan-400">Operations Assistant</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasVoiceSupport && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleVoiceMode}
                        className={cn(
                          "transition-colors",
                          voiceEnabled 
                            ? "text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30" 
                            : "text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                        )}
                        data-testid="button-toggle-voice"
                      >
                        {voiceEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowGlossary(true)}
                      className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                      data-testid="button-open-glossary"
                    >
                      <BookOpen className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        stopSpeaking();
                        stopListening();
                        setIsOpen(false);
                      }}
                      className="text-slate-400 hover:text-white"
                      data-testid="button-close-chat"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 relative group",
                      msg.role === 'user' 
                        ? "bg-cyan-500 text-white rounded-br-md" 
                        : "bg-slate-700/50 text-slate-200 rounded-bl-md border border-slate-600/50"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => toggleSpeak(msg.id, msg.content)}
                          className={cn(
                            "absolute -right-2 -bottom-2 w-7 h-7 rounded-full flex items-center justify-center transition-all",
                            speakingId === msg.id
                              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/50"
                              : "bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-cyan-500 hover:text-white"
                          )}
                          data-testid={`button-speak-${msg.id}`}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {chatMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-600/50">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-slate-500 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputValue(q);
                          inputRef.current?.focus();
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-400 border border-slate-600/50 transition-colors"
                        data-testid={`quick-question-${i}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-cyan-500/20 bg-slate-900/50">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Listening..." : "Ask Orby anything..."}
                    className={cn(
                      "flex-1 bg-slate-800/50 border rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1",
                      isListening 
                        ? "border-cyan-400 ring-1 ring-cyan-400/50 placeholder:text-cyan-400" 
                        : "border-slate-600/50 focus:border-cyan-500/50 focus:ring-cyan-500/30"
                    )}
                    disabled={chatMutation.isPending}
                    data-testid="input-chat-message"
                  />
                  {voiceEnabled && hasVoiceSupport && (
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      disabled={chatMutation.isPending}
                      className={cn(
                        "rounded-xl px-3",
                        isListening 
                          ? "bg-red-500 hover:bg-red-400 text-white animate-pulse" 
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                      )}
                      data-testid="button-voice-input"
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  )}
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || chatMutation.isPending}
                    className="bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl px-4"
                    data-testid="button-send-message"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  {voiceEnabled 
                    ? "Voice mode enabled - tap mic to speak" 
                    : "Tap the speaker icon on any response to hear it read aloud"}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVoiceDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowVoiceDisclaimer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-amber-500/30 p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Voice Mode</h3>
              </div>
              
              <p className="text-slate-300 text-sm mb-4">
                The stadium is a noisy environment. Voice input may not work reliably in loud areas.
              </p>
              
              <p className="text-slate-400 text-xs mb-6">
                For best results, use voice input in quiet areas like offices or during low-traffic periods.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowVoiceDisclaimer(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  data-testid="button-cancel-voice"
                >
                  Cancel
                </Button>
                <Button
                  onClick={acceptVoiceDisclaimer}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-white"
                  data-testid="button-enable-voice"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Enable Voice
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrbyGlossary isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
    </>
  );
}
