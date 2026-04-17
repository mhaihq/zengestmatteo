import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Bot, User, Square, TriangleAlert as AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from '@/components/ui/prompt-input';
import { useSpeechToText } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';
import { getAvatarColor, getInitials } from '@/lib/avatar-utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Summarize last session notes",
  "What homework was assigned?",
  "Suggest therapeutic interventions",
  "Draft a progress note",
];

interface AssistantChatProps {
  clientName: string;
  compact?: boolean;
}

export function AssistantChat({ clientName, compact = false }: AssistantChatProps) {
  const { t, i18n } = useTranslation();
  const {
    listening,
    transcript,
    supported,
    start: startListening,
    stop: stopListening,
    resetTranscript,
  } = useSpeechToText(i18n.language);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your clinical assistant for ${clientName}. I can help you review session notes, suggest interventions, draft documentation, and more. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const inputBeforeSpeechRef = useRef('');
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setScrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const viewport = node.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        scrollViewportRef.current = viewport;
      }
    }
  }, []);

  useEffect(() => {
    if (listening && transcript) {
      const base = inputBeforeSpeechRef.current;
      const separator = base && !base.endsWith(' ') ? ' ' : '';
      setInput(base + separator + transcript);
    }
  }, [transcript, listening]);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const toggleListening = () => {
    if (listening) {
      stopListening();
      inputBeforeSpeechRef.current = input;
    } else {
      inputBeforeSpeechRef.current = input;
      resetTranscript();
      startListening();
    }
  };

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping || streamingId) return;

    if (listening) stopListening();

    const userMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    inputBeforeSpeechRef.current = '';
    resetTranscript();
    setIsTyping(true);

    setTimeout(() => {
      const fullResponse = getAssistantResponse(messageText);
      const tokens = fullResponse.split(' ');
      const msgId = String(Date.now() + 1);

      const assistantMessage: Message = {
        id: msgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      setStreamingId(msgId);

      let wordIndex = 0;
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

      streamIntervalRef.current = setInterval(() => {
        wordIndex++;
        const currentContent = tokens.slice(0, wordIndex).join(' ');
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, content: currentContent } : m))
        );
        if (wordIndex >= tokens.length) {
          clearInterval(streamIntervalRef.current!);
          streamIntervalRef.current = null;
          setStreamingId(null);
        }
      }, 38);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full">
      {compact && (
        <div className={cn(
          "flex items-center gap-2.5 px-3 py-2 border-b shrink-0"
        )}>
          <Avatar className={cn("h-7 w-7 shrink-0", getAvatarColor(clientName))}>
            <AvatarFallback className="text-white text-[10px] font-semibold">
              {getInitials(clientName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{clientName}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground">Online</span>
          </div>
        </div>
      )}

      <ScrollArea
        className={cn("flex-1", compact ? "px-3" : "px-4 md:px-6")}
        ref={setScrollRef}
      >
        <div className={cn(
          compact ? "py-3 space-y-4" : "max-w-2xl mx-auto py-6 space-y-6"
        )}>
          {compact && !warningDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug text-amber-700 dark:text-amber-400 flex-1">
                {t('assistant.tempChatWarning')}
              </p>
              <button
                onClick={() => setWarningDismissed(true)}
                className="shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: compact ? 8 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex",
                  compact ? "gap-2" : "gap-3",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className={cn(
                  "shrink-0",
                  compact ? "h-7 w-7" : "h-8 w-8",
                  message.role === 'assistant'
                    ? "bg-foreground"
                    : "bg-muted"
                )}>
                  <AvatarFallback className={cn(
                    "text-xs font-semibold",
                    message.role === 'assistant'
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  )}>
                    {message.role === 'assistant'
                      ? <Bot className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                      : <User className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                    }
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "rounded-2xl",
                  compact ? "max-w-[85%] px-3 py-2" : "max-w-[80%] px-4 py-3",
                  message.role === 'user'
                    ? "bg-foreground text-background"
                    : "bg-muted"
                )}>
                  <p className={cn(
                    "leading-relaxed whitespace-pre-wrap",
                    compact ? "text-xs" : "text-sm"
                  )}>
                    {message.content}
                    {streamingId === message.id && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-0.5 h-3.5 ml-0.5 align-middle bg-current rounded-sm"
                      />
                    )}
                  </p>
                  <p className={cn(
                    "text-[10px] mt-1.5",
                    message.role === 'user'
                      ? "text-background/50"
                      : "text-muted-foreground"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", compact ? "gap-2" : "gap-3")}
            >
              <Avatar className={cn(
                "shrink-0 bg-foreground",
                compact ? "h-7 w-7" : "h-8 w-8"
              )}>
                <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
                  <Bot className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "bg-muted rounded-2xl",
                compact ? "px-3 py-2" : "px-4 py-3"
              )}>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "rounded-full bg-muted-foreground/40",
                        compact ? "h-1.5 w-1.5" : "h-2 w-2"
                      )}
                      animate={{ y: [0, compact ? -3 : -4, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "grid gap-2 pt-2",
                compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              )}
            >
              {SUGGESTIONS.map((suggestion) => (
                <PromptSuggestion
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className={cn(
                    "h-auto",
                    compact ? "text-[11px] py-2 px-3" : "text-xs py-2.5 px-4"
                  )}
                  size="sm"
                >
                  {suggestion}
                </PromptSuggestion>
              ))}
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className={cn(
        "bg-background shrink-0",
        compact ? "px-3 pb-3 pt-2" : "px-4 pb-20 md:pb-4 pt-4"
      )}>
        <div className={compact ? "" : "max-w-2xl mx-auto"}>
          <PromptInput
            value={input}
            onValueChange={setInput}
            onSubmit={() => handleSend()}
            isLoading={isTyping || !!streamingId}
            className={cn(
              listening && "ring-2 ring-red-400/50"
            )}
          >
            <PromptInputTextarea
              placeholder={t('assistant.askAboutClient')}
              className={compact ? "text-xs min-h-[36px]" : "text-sm"}
            />
            <PromptInputActions className={cn(
              "justify-between",
              compact ? "px-1.5 pb-0.5" : "px-2 pb-1"
            )}>
              <div className="flex items-center gap-1">
                {listening && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5 text-xs text-red-500 mr-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    {transcript ? "Listening..." : "Speak now..."}
                  </motion.div>
                )}
                {!supported && !compact && (
                  <span className="text-xs text-muted-foreground">
                    Voice requires Chrome/Edge
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <PromptInputAction
                  tooltip={
                    !supported
                      ? "Speech recognition not supported. Use Chrome."
                      : listening
                        ? "Stop listening"
                        : "Voice input"
                  }
                >
                  <Button
                    variant={listening ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleListening}
                    disabled={!supported}
                    className={cn(
                      "rounded-full transition-all",
                      compact ? "h-8 w-8" : "h-9 w-9",
                      listening && "animate-pulse"
                    )}
                  >
                    {listening ? (
                      <Square className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                    ) : (
                      <Mic className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                    )}
                  </Button>
                </PromptInputAction>
                <PromptInputAction tooltip="Send message">
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping || !!streamingId}
                    size="icon"
                    className={cn(
                      "rounded-full",
                      compact ? "h-8 w-8" : "h-9 w-9"
                    )}
                  >
                    <Send className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                  </Button>
                </PromptInputAction>
              </div>
            </PromptInputActions>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}

function getAssistantResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes('summarize') || lower.includes('summary') || lower.includes('notes')) {
    return "Based on the last session notes, the client has been making progress with anxiety management. Key themes included work-life balance concerns and the development of coping strategies. The client showed good engagement and self-reflection throughout the session.";
  }

  if (lower.includes('homework') || lower.includes('assigned')) {
    return "In the previous session, the following homework was assigned:\n\n1. Daily mood tracking journal - noting triggers and responses\n2. Practice the 4-7-8 breathing technique twice daily\n3. Complete the thought record worksheet for any anxious episodes\n\nThe client expressed willingness to complete all assignments.";
  }

  if (lower.includes('intervention') || lower.includes('suggest')) {
    return "Based on the client's progress and current presentation, here are some recommended interventions:\n\n1. Cognitive restructuring - addressing automatic negative thoughts about work performance\n2. Behavioral activation - scheduling pleasant activities to improve mood\n3. Mindfulness-based stress reduction techniques\n4. Graded exposure for social anxiety triggers identified in previous sessions";
  }

  if (lower.includes('progress note') || lower.includes('draft')) {
    return "Here's a draft progress note:\n\nSubjective: Client reports moderate improvement in anxiety symptoms since last session. Sleep quality has improved slightly. Continues to experience worry about work deadlines.\n\nObjective: Client appeared well-groomed, cooperative, and engaged. Affect was appropriate. Speech was normal in rate and rhythm.\n\nAssessment: Client is making gradual progress toward treatment goals. GAD symptoms showing reduction.\n\nPlan: Continue weekly sessions. Review homework completion. Introduce progressive muscle relaxation.";
  }

  return "I understand your question. As your clinical assistant, I can help you with session summaries, treatment planning, progress notes, and intervention suggestions. Could you provide more details about what specific information you need for this client?";
}
