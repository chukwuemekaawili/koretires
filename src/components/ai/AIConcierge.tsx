import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Loader2,
  Bot,
  User,
  Phone,
  ChevronDown,
  Volume2,
  VolumeX,
  AlertCircle,
  PhoneCall,
  Calendar,
  Car,
  Building,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickActions = [
  { label: "Find tires", icon: Car, message: "Help me find the right tires for my vehicle" },
  { label: "Book service", icon: Calendar, message: "I'd like to book a tire service appointment" },
  { label: "Mobile swap", icon: Car, message: "Tell me about your mobile tire swap service" },
  { label: "Dealer pricing", icon: Building, message: "I'm interested in dealer/wholesale pricing" },
  { label: "Request callback", icon: PhoneCall, message: "I'd like to request a callback from your team" },
];

// Swipe-to-close thresholds
const DRAG_CLOSE_THRESHOLD = 100; // px distance to trigger close
const DRAG_VELOCITY_THRESHOLD = 500; // px/s velocity to trigger close

export function AIConcierge() {
  const { user } = useAuth();
  const { companyInfo, formatPhone, getWhatsAppUrl } = useCompanyInfo();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm Kore AI, your tire expert. I can help you find the perfect tires, answer questions about our services, or connect you with our team. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRootRef = useRef<HTMLDivElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const dragControls = useDragControls();

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Handle drag end: close if swiped down past threshold or with enough velocity
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      const swipedDown = offset.y > DRAG_CLOSE_THRESHOLD || velocity.y > DRAG_VELOCITY_THRESHOLD;
      if (swipedDown) {
        setIsOpen(false);
      }
    },
    []
  );

  // Check for post-order auto-open context
  useEffect(() => {
    const orderContext = localStorage.getItem('openAIChatWithContext');
    if (orderContext) {
      localStorage.removeItem('openAIChatWithContext');
      setIsOpen(true);
      setMessages(prev => [...prev, {
        id: `msg_order_${Date.now()}`,
        role: 'assistant',
        content: `Thanks for your order ${orderContext}! 🎉 I'm here if you have any questions about your tires, installation, or delivery. How can I help?`,
        timestamp: new Date()
      }]);
    }
  }, []);

  // Dispatch custom event when chat open state changes to hide/show mobile bottom bar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ai-chat-toggle', { detail: { isOpen } }));
  }, [isOpen]);

  const getMessageListEl = useCallback(() => {
    if (messageListRef.current) return messageListRef.current;

    const root = scrollAreaRootRef.current;
    const viewport = root?.querySelector<HTMLDivElement>("[data-radix-scroll-area-viewport]") || null;
    if (viewport) messageListRef.current = viewport;
    return viewport;
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    const el = getMessageListEl();
    if (el) el.scrollTop = el.scrollHeight;
  }, [getMessageListEl]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-scroll when input receives focus (keyboard opens on mobile)
  const handleInputFocus = useCallback(() => {
    // Small delay to allow keyboard to finish appearing
    setTimeout(scrollToBottom, 150);
  }, [scrollToBottom]);

  // Visual Viewport API: snap chat height to available visual viewport on mobile keyboard open
  useEffect(() => {
    if (!isOpen) return;

    const vv = window.visualViewport;
    if (!vv) return;

    // Only apply this behavior on mobile; desktop should remain md:h-[70vh]
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    const containerEl = chatContainerRef.current;
    if (!containerEl) return;

    const prevHeight = containerEl.style.height;

    const handleResize = () => {
      containerEl.style.height = `${Math.round(vv.height)}px`;

      const listEl = getMessageListEl();
      if (listEl) listEl.scrollTop = listEl.scrollHeight;
    };

    handleResize();
    vv.addEventListener("resize", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      containerEl.style.height = prevHeight;
    };
  }, [getMessageListEl, isOpen]);

  const speakMessage = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setHasError(false);
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Use supabase.functions.invoke instead of hardcoded URL
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: content,
          sessionId,
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          channel: "web",
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: data?.message || "I'm having trouble responding. Please try again.",
        timestamp: new Date(),
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      setHasError(true);
      
      toast({
        title: "Connection Issue",
        description: "Unable to reach our AI assistant. Please try again or call us directly.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: `I apologize, but I'm having trouble responding right now. Please call us at ${companyInfo.contact.phone} for immediate assistance, or try again in a moment.`,
        timestamp: new Date(),
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        toast({
          title: "Voice Not Supported",
          description: "Your browser doesn't support voice input. Please type your message instead.",
          variant: "destructive",
        });
        return;
      }
      
      setIsListening(true);
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        if (transcript.trim()) {
          sendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "Couldn't capture your voice. Please try again or type your message.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  const handleRequestCallback = async () => {
    sendMessage("I'd like to request a callback from your team. Please have someone contact me.");
  };

  return (
    <>
      {/* Floating button - HIGH z-index and above mobile bottom bar */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 md:bottom-6 right-4 z-[9999] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg btn-glow-blue flex items-center justify-center"
            aria-label="Open chat with Kore AI"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop overlay on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Chat window - Higher z-index than mobile bottom bar (z-50), extends to bottom on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: "100%", scale: 0.95 }}
            ref={chatContainerRef}
            drag={prefersReducedMotion ? false : "y"}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 md:bottom-6 right-0 left-0 md:left-auto md:right-4 z-[9999] md:w-[400px] h-[100dvh] md:h-[70vh] max-h-none md:max-h-[600px] md:rounded-xl rounded-t-xl border border-border bg-white shadow-xl flex flex-col overflow-hidden touch-none md:touch-auto"
          >
            {/* Drag handle indicator (mobile only) */}
            <div
              className="md:hidden flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing bg-white"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header - Clean white with subtle divider */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">Kore AI</h3>
                  <p className="text-xs text-muted-foreground">Your 24/7 tire expert</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={isSpeaking ? stopSpeaking : () => speakMessage(messages[messages.length - 1]?.content || "")}
                  title={isSpeaking ? "Stop speaking" : "Read last message"}
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href={`tel:${formatPhone(companyInfo.contact.phone)}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error Banner */}
            {hasError && (
              <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Connection issue. </span>
                <a href={`tel:${formatPhone(companyInfo.contact.phone)}`} className="underline font-medium">
                  Call us directly
                </a>
              </div>
            )}

            {/* Messages - Clean white background */}
            <ScrollArea className="flex-1 px-4 py-4 bg-white" ref={scrollAreaRootRef as any}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        message.role === "user"
                          ? "bg-primary"
                          : "bg-muted"
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-foreground" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-md"
                          : "bg-[#F3F4F6] text-foreground rounded-tl-md"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="bg-[#F3F4F6] rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                        <span
                          className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Quick actions - Only show on first message, horizontally scrollable */}
            {messages.length <= 1 && (
              <div className="px-4 pb-3 overflow-x-auto bg-white border-t border-border/50">
                <div className="flex gap-2 min-w-max pt-2">
                  {quickActions.slice(0, 3).map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.message)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <action.icon className="h-3.5 w-3.5" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input - Clean white with subtle border */}
            <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3 border-t border-border bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Type your message..."
                    className="pr-10 h-10 text-sm bg-white border-border focus:border-primary"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors",
                      isListening
                        ? "text-primary bg-primary/10 animate-pulse"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={isListening ? "Listening..." : "Voice input"}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 bg-primary hover:bg-primary/90"
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
