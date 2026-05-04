import { useState, useEffect, useRef } from "react";
import { useListGeminiConversations, useCreateGeminiConversation, useGetGeminiConversation } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Bot, Plus, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AITutor() {
  const queryClient = useQueryClient();
  const { data: conversations, isLoading: isConversationsLoading } = useListGeminiConversations();
  const createConv = useCreateGeminiConversation();
  
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  
  const { data: activeConv, isLoading: isActiveConvLoading } = useGetGeminiConversation(
    activeConvId as number,
    { query: { enabled: !!activeConvId } } as any
  );

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync messages from server when conversation loads
  useEffect(() => {
    if (activeConv?.messages) {
      setMessages(activeConv.messages);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Set default conversation if none active
  useEffect(() => {
    if (!activeConvId && conversations && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const handleNewConversation = () => {
    createConv.mutate(
      { data: { title: "New Chat" } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["/api/gemini/conversations"] });
          setActiveConvId(data.id);
          setMessages([]);
        }
      }
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConvId || isStreaming) return;

    const userMessageText = input.trim();
    setInput("");
    
    // Optimistically add user message
    setMessages(prev => [...prev, { role: "user", content: userMessageText, id: Date.now() }]);
    setIsStreaming(true);

    try {
      // Optimistically add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "", id: Date.now() + 1, isStreaming: true }]);

      const response = await fetch(`/api/gemini/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessageText }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // keep last incomplete chunk
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                setIsStreaming(false);
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  if (lastMsg && lastMsg.isStreaming) {
                    lastMsg.isStreaming = false;
                  }
                  return newMsgs;
                });
                queryClient.invalidateQueries({ queryKey: [`/api/gemini/conversations/${activeConvId}`] });
              } else if (data.content) {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  if (lastMsg && lastMsg.isStreaming) {
                    lastMsg.content += data.content;
                  }
                  return newMsgs;
                });
              }
            } catch (e) {
              console.error("Error parsing SSE data", e);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsStreaming(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] flex flex-col sm:flex-row gap-4">
      {/* Sidebar for conversations */}
      <Card className="w-full sm:w-64 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b">
          <Button onClick={handleNewConversation} className="w-full" disabled={createConv.isPending}>
            {createConv.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isConversationsLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading chats...</div>
            ) : conversations?.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md truncate transition-colors ${
                  activeConvId === conv.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {conv.title || `Chat ${conv.id}`}
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden relative">
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <Bot className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">AI Tutor</h3>
            <p className="text-sm max-w-sm mt-2">Ask questions about MPPSC syllabus, get explanations for hard concepts, or request study strategies.</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6 pb-4">
                {messages.length === 0 && !isActiveConvLoading && (
                  <div className="text-center text-muted-foreground text-sm my-8">
                    Start asking questions to your AI Tutor.
                  </div>
                )}
                
                {messages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary animate-pulse" />
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-4 bg-background border-t">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about MPPSC topics..."
                  disabled={isStreaming}
                  className="flex-1"
                />
                <Button type="submit" disabled={!input.trim() || isStreaming} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
