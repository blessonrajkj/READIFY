"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Sparkles, Send, BookOpen, Key, Hourglass, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Source {
  page: number | null;
  chapter_title: string;
  snippet: string;
}

interface Concept {
  term: string;
  definition: string;
}

interface ChapterSummary {
  summary: string;
  key_takeaways: string[];
  important_concepts: Concept[];
  estimated_minutes: number;
}

interface AiAssistantProps {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
}

export default function AiAssistant({ bookId, chapterId, chapterTitle }: AiAssistantProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  
  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [lastSources, setLastSources] = useState<Source[]>([]);
  
  // Summary States
  const [summaryData, setSummaryData] = useState<ChapterSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch chapter summary when chapter changes
  useEffect(() => {
    if (activeTab === "summary") {
      fetchSummary();
    }
  }, [chapterId, activeTab]);

  useEffect(() => {
    // Auto-scroll chat to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSummary = async () => {
    setIsSummaryLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/books/${bookId}/assistant/chapters/${chapterId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (err) {
      console.error("Failed to fetch chapter summary", err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const userText = inputMessage;
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setIsChatLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/api/books/${bookId}/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userText,
          conversation_id: conversationId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversation_id);
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
        if (data.sources) {
          setLastSources(data.sources);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: Could not connect to assistant endpoint." }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Network failure." }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border transition-premium">
      {/* Sidebar Header Tabs */}
      <div className="flex border-b border-border bg-muted/30 p-1">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-premium ${
            activeTab === "summary"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Chapter Notes
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-premium ${
            activeTab === "chat"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Ask Assistant
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === "summary" ? (
          /* SUMMARY TAB */
          isSummaryLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs">Preparing chapter insights...</p>
            </div>
          ) : summaryData ? (
            <div className="flex flex-col gap-6 font-sans">
              {/* Estimated reading time badge */}
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full w-max">
                <Hourglass className="w-3.5 h-3.5" />
                <span>Estimated listening: {summaryData.estimated_minutes} min</span>
              </div>

              {/* Summary */}
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Summary
                </h4>
                <p className="text-xs md:text-sm leading-relaxed text-muted-foreground/90 whitespace-pre-line">
                  {summaryData.summary}
                </p>
              </div>

              {/* Key Takeaways */}
              {summaryData.key_takeaways && summaryData.key_takeaways.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <h4 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-primary" />
                    Key Takeaways
                  </h4>
                  <ul className="list-disc list-inside flex flex-col gap-1.5 text-xs md:text-sm text-muted-foreground">
                    {summaryData.key_takeaways.map((point, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-muted-foreground/95 ml-1">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important Concepts */}
              {summaryData.important_concepts && summaryData.important_concepts.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <h4 className="text-sm font-semibold tracking-tight text-foreground">
                    Core Concepts
                  </h4>
                  <div className="flex flex-col gap-3">
                    {summaryData.important_concepts.map((concept, idx) => (
                      // Double bezel structure
                      <div key={idx} className="p-1 rounded-xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
                        <div className="p-3 rounded-lg bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-1 text-xs">
                          <span className="font-bold text-foreground">{concept.term}</span>
                          <span className="text-muted-foreground">{concept.definition}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-muted-foreground py-10">
              No summary details available for this chapter.
            </div>
          )
        ) : (
          /* CHAT TAB */
          <div className="flex flex-col h-full justify-between">
            {/* Messages Scroll Area */}
            <div className="flex-1 space-y-4 mb-4 pr-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Sparkles className="w-8 h-8 opacity-20 mb-3" />
                  <p className="text-xs max-w-[200px]">
                    Ask any question about this book. The AI answers using page segments.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs md:text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none border border-border"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-2xl rounded-tl-none border border-border px-4 py-3 text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching pages...</span>
                  </div>
                </div>
              )}

              {/* Citations / Sources */}
              {!isChatLoading && lastSources.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
                <div className="p-3 bg-muted/40 border border-border rounded-2xl text-[10px] space-y-1">
                  <div className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Retrieved Pages:</div>
                  <div className="flex flex-wrap gap-1">
                    {lastSources.map((src, i) => (
                      <span key={i} className="bg-card border border-border px-2 py-0.5 rounded-full" title={src.snippet}>
                        Page {src.page ? src.page + 1 : "N/A"} ({src.chapter_title})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-border pt-4">
              <input
                type="text"
                placeholder="Ask about this book..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-muted border border-border rounded-xl px-4 py-2 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-premium"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isChatLoading}
                className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none transition-premium"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
