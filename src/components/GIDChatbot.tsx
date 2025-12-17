import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { GIDRecord, ProjectPhase } from "@/lib/csv-parser";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GIDChatbotProps {
  selectedElement: string | null;
  projectPhase: ProjectPhase | null;
  prescriptions: GIDRecord[];
}

export function GIDChatbot({ selectedElement, projectPhase, prescriptions }: GIDChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gid-chatbot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage,
            context: {
              element: selectedElement,
              phase: projectPhase,
              prescriptions: prescriptions.slice(0, 15).map((p) => ({
                propriete: p.Propriete,
                type: p.TypeDocument,
                ifc: p.IFC_Reference,
                revit: p.Revit_Param,
              })),
            },
            history: messages.slice(-6),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Erreur de connexion. Réessayez.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,40%)] text-white"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </SheetTrigger>

        <SheetContent className="w-[400px] sm:w-[450px] flex flex-col p-0 bg-[hsl(222,47%,11%)] border-[hsl(199,89%,48%,0.3)]">
          <SheetHeader className="p-4 border-b border-[hsl(199,89%,48%,0.2)]">
            <SheetTitle className="flex items-center gap-2 text-[hsl(199,89%,48%)]">
              <Bot className="h-5 w-5" />
              Assistant GID
            </SheetTitle>
            {(selectedElement || projectPhase) && (
              <div className="flex gap-2 flex-wrap">
                {selectedElement && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedElement}
                  </Badge>
                )}
                {projectPhase && (
                  <Badge variant="outline" className="text-xs">
                    Phase {projectPhase}
                  </Badge>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-300 py-6">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    Posez vos questions sur le standard GID, les prescriptions Revit ou l'IFC.
                  </p>
                  {selectedElement && (
                    <p className="text-xs mt-2 text-[hsl(199,89%,48%)]">
                      Contexte : {selectedElement} ({prescriptions.length} prescriptions)
                    </p>
                  )}
                  
                  {/* Predefined questions */}
                  <div className="mt-6 space-y-2">
                    <p className="text-xs text-slate-400 mb-3">Questions suggérées :</p>
                    {[
                      "Quelles propriétés sont obligatoires ?",
                      "Comment configurer l'export IFC ?",
                      "Quelle est la différence entre IFC_Reference et Revit_Param ?",
                      "Comment renseigner la résistance au feu ?",
                    ].map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(question);
                        }}
                        className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-[hsl(222,47%,18%)] hover:bg-[hsl(222,47%,22%)] text-slate-300 hover:text-white transition-colors border border-[hsl(199,89%,48%,0.2)]"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-[hsl(199,89%,48%,0.2)] flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-[hsl(199,89%,48%)]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-[hsl(199,89%,48%)] text-white"
                        : "bg-[hsl(222,47%,18%)] text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-8 w-8 rounded-full bg-[hsl(199,89%,48%,0.2)] flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[hsl(199,89%,48%)]" />
                  </div>
                  <div className="bg-[hsl(222,47%,18%)] rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[hsl(199,89%,48%)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[hsl(199,89%,48%)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[hsl(199,89%,48%)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-[hsl(199,89%,48%,0.2)]">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className="flex-1 bg-[hsl(222,47%,18%)] border-[hsl(199,89%,48%,0.3)] text-white placeholder:text-slate-400"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,40%)]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
