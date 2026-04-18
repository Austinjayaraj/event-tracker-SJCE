import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! I'm your Student Event Assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (newMessages: Message[]) => {
      const res = await apiRequest("POST", "/api/chat", { messages: newMessages });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.choices && data.choices[0]?.message) {
        setMessages((prev) => [...prev, data.choices[0].message]);
      }
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I am having trouble connecting to the server. Please try again later." },
      ]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput("");
    
    // Only send non-system messages to the API
    chatMutation.mutate(newMessages.filter(m => m.role !== "system"));
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            size="icon"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 shadow-[0_4px_15px_rgba(56,189,248,0.3)] hover:scale-105 transition-transform"
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </Button>
        )}

        {isOpen && (
          <Card className="glass w-[350px] h-[500px] flex flex-col border border-cyan-500/20 shadow-2xl bg-[#0A0B0E]/95 overflow-hidden animate-in slide-in-from-bottom-5">
            <CardHeader className="p-4 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center">
                <MessageSquare className="h-5 w-5 text-cyan-400 mr-2" />
                AI Career Mentor
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-full overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4 flex flex-col pb-2">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        m.role === "user"
                          ? "bg-cyan-500/20 text-cyan-50 self-end rounded-tr-sm border border-cyan-500/30"
                          : "bg-[#11131A] text-gray-200 self-start rounded-tl-sm border border-white/5"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="bg-[#11131A] text-gray-400 self-start rounded-2xl rounded-tl-sm border border-white/5 px-4 py-2 text-sm italic">
                      Typing...
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 border-t border-white/5 bg-black/20 flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Ask a question..."
                  className="flex-1 bg-[#11131A] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-cyan-500/50"
                  disabled={chatMutation.isPending}
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  disabled={!input.trim() || chatMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
