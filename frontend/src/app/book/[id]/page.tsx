"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Play, Clock, BookOpen, Edit3, Trash2, 
  Loader2, Check, Headphones, MessageSquare, ListChecks, 
  FileText, Layers, Award, BarChart2, Sparkles, ExternalLink
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CoverImage from "@/components/CoverImage";
import FlashcardsWorkspace from "@/components/FlashcardsWorkspace";
import QuizWorkspace from "@/components/QuizWorkspace";
import StudyNotesWorkspace from "@/components/StudyNotesWorkspace";
import ChapterSummariesWorkspace from "@/components/ChapterSummariesWorkspace";
import BookAnalyticsWorkspace from "@/components/BookAnalyticsWorkspace";
import AiAssistant from "@/components/AiAssistant";

interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_path: string | null;
  status: string;
  total_pages: number;
  file_size: number;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  duration: number;
  start_page: number | null;
  end_page: number | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabType = "overview" | "listen" | "read" | "assistant" | "summaries" | "notes" | "flashcards" | "quiz" | "analytics";

function BookWorkspaceContent({ bookId }: { bookId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(tabParam || "overview");
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Chapter editing
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    loadBookData();
  }, [bookId]);

  const loadBookData = async () => {
    setIsLoading(true);
    try {
      const bookRes = await fetch(`/api/books/${bookId}`);
      if (!bookRes.ok) throw new Error("Failed to load book");
      const bookData = await bookRes.json();
      setBook(bookData);

      const chRes = await fetch(`/api/books/${bookId}/chapters/`);
      if (!chRes.ok) throw new Error("Failed to load chapters");
      const chData = await chRes.json();
      setChapters(chData);

      // Fetch listening progress
      const progRes = await fetch(`/api/books/${bookId}/progress/`);
      if (progRes.ok && chData.length > 0) {
        const progData = await progRes.json();
        const activeCh = chData.find((c: any) => c.id === progData.current_chapter_id) || chData[0];
        const activeIdx = chData.indexOf(activeCh);
        
        let percent = Math.round(((activeIdx + (progData.position_seconds / (activeCh.duration || 1))) / chData.length) * 100);
        setProgressPercent(Math.min(100, Math.max(0, percent)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameChapter = async (chapterId: string) => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/books/${bookId}/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle })
      });
      if (res.ok) {
        setEditingChapterId(null);
        loadBookData();
      }
    } catch (err) {
      console.error("Failed to rename chapter", err);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;
    try {
      const res = await fetch(`/api/books/${bookId}/chapters/${chapterId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        loadBookData();
      }
    } catch (err) {
      console.error("Failed to delete chapter", err);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const totalDurationSecs = chapters.reduce((sum, ch) => sum + (ch.duration || 0), 0);
  const totalDurationHours = Math.floor(totalDurationSecs / 3600);
  const totalDurationMins = Math.floor((totalDurationSecs % 3600) / 60);

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "listen", label: "Listen", icon: Headphones },
    { id: "read", label: "Read", icon: Play },
    { id: "assistant", label: "AI Assistant", icon: MessageSquare },
    { id: "summaries", label: "Summaries", icon: ListChecks },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "flashcards", label: "Flashcards", icon: Layers },
    { id: "quiz", label: "Practice Tests", icon: Award },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
  ];

  if (isLoading || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="text-sm font-sans">Loading AI Study Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-premium font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-28 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/library" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-premium">
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            AI Study Workspace
          </span>
        </div>

        {/* 9-Tab Navigation Bar */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-muted/40 border border-border/40 w-max min-w-full md:min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    router.replace(`/book/${bookId}?tab=${tab.id}`, { scroll: false });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-premium ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* =================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-12">
            {/* Book Overview Editorial Split */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
              {/* Cover */}
              <div className="w-48 md:w-56 h-64 md:h-80 shadow-2xl rounded-[2rem] overflow-hidden flex-shrink-0 mx-auto md:mx-0">
                <CoverImage title={book.title} author={book.author || "Unknown"} coverPath={book.cover_path || undefined} />
              </div>

              {/* Details & Actions */}
              <div className="flex-1 flex flex-col justify-between self-stretch py-2 text-center md:text-left space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3 h-3" /> Ready for Learning
                  </div>
                  <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">{book.title}</h1>
                  <p className="text-sm md:text-base text-muted-foreground/80 mt-1">{book.author || "Unknown Author"}</p>
                  
                  <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {book.total_pages} Pages</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {chapters.length} Chapters</span>
                    <span className="flex items-center gap-1">
                      <Headphones className="w-4 h-4" /> ~{totalDurationHours}h {totalDurationMins}m Listening
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 max-w-md mx-auto md:mx-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold">Overall Course Progress</span>
                    <span className="font-mono">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-premium" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  <Link
                    href={`/book/${book.id}/read`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:scale-105 active:scale-95 transition-premium shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Synchronized Reader & Audio
                  </Link>

                  <button
                    onClick={() => setActiveTab("flashcards")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-premium"
                  >
                    <Layers className="w-4 h-4" /> Study Flashcards
                  </button>

                  <button
                    onClick={() => setActiveTab("quiz")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-premium"
                  >
                    <Award className="w-4 h-4" /> Take Practice Test
                  </button>
                </div>
              </div>
            </div>

            {/* Chapters List */}
            <div className="border-t border-border pt-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Structured Chapters</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Chapter-by-chapter audio tracks and extracted study text.</p>
                </div>
              </div>

              {chapters.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-10">
                  No chapters detected yet.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {chapters.map((ch, idx) => {
                    const isEditing = editingChapterId === ch.id;
                    return (
                      <div key={ch.id} className="p-1 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:shadow-sm transition-premium">
                        <div className="px-5 py-4 rounded-xl bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-between gap-4">
                          <div className="flex-1 flex items-center gap-4 min-w-0">
                            <span className="text-xs font-mono font-bold text-muted-foreground w-6">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="bg-muted border border-border rounded-xl px-3 py-1 text-xs focus:outline-none flex-1 max-w-sm font-semibold text-foreground"
                                  placeholder="Chapter title"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRenameChapter(ch.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="truncate">
                                <p className="text-xs font-bold tracking-tight text-foreground truncate">{ch.title}</p>
                                {ch.start_page !== null && ch.end_page !== null && (
                                  <p className="text-[10px] text-muted-foreground">Pages {ch.start_page + 1} - {ch.end_page + 1}</p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(ch.duration)}
                            </span>

                            <Link
                              href={`/book/${book.id}/read`}
                              className="p-2 rounded-full hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-premium"
                              title="Listen / Read Chapter"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </Link>

                            {!isEditing && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingChapterId(ch.id);
                                    setEditTitle(ch.title);
                                  }}
                                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-premium active:scale-90"
                                  title="Rename"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteChapter(ch.id)}
                                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive transition-premium active:scale-90"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: LISTEN */}
        {/* =================================================================== */}
        {activeTab === "listen" && (
          <div className="double-bezel-outer p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Headphones className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Audiobook Player Theater</h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Listen with real-time speed adjustments, sleep countdown, and Web Audio API Equalizer presets.
              </p>
            </div>
            <Link
              href={`/book/${book.id}/read`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:scale-105 active:scale-95 transition-premium shadow-xl"
            >
              <Play className="w-4 h-4 fill-current" /> Launch Audiobook Player
            </Link>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: READ */}
        {/* =================================================================== */}
        {activeTab === "read" && (
          <div className="double-bezel-outer p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Synchronized Text & Audio Reader</h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Read while listening. Spoken paragraphs highlight automatically with instant seeking.
              </p>
            </div>
            <Link
              href={`/book/${book.id}/read`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:scale-105 active:scale-95 transition-premium shadow-xl"
            >
              <ExternalLink className="w-4 h-4" /> Open Synchronized Reader
            </Link>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: AI ASSISTANT */}
        {/* =================================================================== */}
        {activeTab === "assistant" && (
          <div className="h-[650px] rounded-3xl overflow-hidden border border-border/40 shadow-xl bg-card">
            <AiAssistant bookId={book.id} />
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: SUMMARIES */}
        {/* =================================================================== */}
        {activeTab === "summaries" && (
          <ChapterSummariesWorkspace bookId={book.id} chapters={chapters} />
        )}

        {/* =================================================================== */}
        {/* TAB 6: NOTES */}
        {/* =================================================================== */}
        {activeTab === "notes" && (
          <StudyNotesWorkspace bookId={book.id} chapters={chapters} />
        )}

        {/* =================================================================== */}
        {/* TAB 7: FLASHCARDS */}
        {/* =================================================================== */}
        {activeTab === "flashcards" && (
          <FlashcardsWorkspace bookId={book.id} chapters={chapters} />
        )}

        {/* =================================================================== */}
        {/* TAB 8: PRACTICE TESTS */}
        {/* =================================================================== */}
        {activeTab === "quiz" && (
          <QuizWorkspace bookId={book.id} chapters={chapters} />
        )}

        {/* =================================================================== */}
        {/* TAB 9: ANALYTICS */}
        {/* =================================================================== */}
        {activeTab === "analytics" && (
          <BookAnalyticsWorkspace bookId={book.id} />
        )}
      </main>
    </div>
  );
}

export default function BookDetailsPage({ params }: PageProps) {
  const { id: bookId } = use(params);
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BookWorkspaceContent bookId={bookId} />
    </Suspense>
  );
}
