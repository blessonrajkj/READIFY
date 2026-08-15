"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Sidebar, Search, MessageSquare, BookOpen, 
  Menu, ChevronRight, Volume2, Sparkles, Check, Play, RefreshCw, Loader2, Bookmark
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AudioPlayer from "@/components/AudioPlayer";
import SyncedReader from "@/components/SyncedReader";
import AiAssistant from "@/components/AiAssistant";
import BookmarksPanel from "@/components/BookmarksPanel";

interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_path: string | null;
  status: string;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  duration: number;
  start_page: number | null;
  end_page: number | null;
}

interface AudioChunk {
  chunk_id: string;
  text: string;
  chunk_index: number;
  page_number: number | null;
  audio_url: string | null;
  status: string;
  duration: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReadPage({ params }: PageProps) {
  const router = useRouter();
  const { id: bookId } = use(params);

  // Data states
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [chunks, setChunks] = useState<AudioChunk[]>([]);
  
  // Player state
  const [initialPosition, setInitialPosition] = useState(0);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [activeChunkText, setActiveChunkText] = useState("");

  // Resume prompt state
  const [resumePrompt, setResumePrompt] = useState<{
    chapterId: string;
    chapterTitle: string;
    positionSeconds: number;
  } | null>(null);

  // UI layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"ai" | "bookmarks">("ai");
  const [isChapterListOpen, setIsChapterListOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChunksLoading, setIsChunksLoading] = useState(false);

  // Search inside book
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    loadBookAndChapters();
  }, [bookId]);

  const loadBookAndChapters = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Book Details
      const bookRes = await fetch(`http://localhost:8000/api/books/${bookId}`);
      if (!bookRes.ok) throw new Error("Failed to load book");
      const bookData = await bookRes.json();
      setBook(bookData);

      // 2. Fetch Chapters
      const chRes = await fetch(`http://localhost:8000/api/books/${bookId}/chapters/`);
      if (!chRes.ok) throw new Error("Failed to load chapters");
      const chData: Chapter[] = await chRes.json();
      setChapters(chData);

      if (chData.length > 0) {
        // 3. Fetch Listening Progress
        const progRes = await fetch(`http://localhost:8000/api/books/${bookId}/progress/`);
        if (progRes.ok) {
          const progData = await progRes.json();
          
          if (progData.current_chapter_id) {
            const chIndex = chData.findIndex((c) => c.id === progData.current_chapter_id);
            if (chIndex !== -1) {
              // If we have progress, set a resume prompt banner instead of autostarting
              if (progData.position_seconds > 2) {
                setResumePrompt({
                  chapterId: progData.current_chapter_id,
                  chapterTitle: chData[chIndex].title,
                  positionSeconds: progData.position_seconds
                });
              }
              setActiveChapterIndex(chIndex);
              fetchChapterChunks(chData[chIndex].id);
            } else {
              fetchChapterChunks(chData[0].id);
            }
          } else {
            fetchChapterChunks(chData[0].id);
          }
        } else {
          fetchChapterChunks(chData[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChapterChunks = async (chId: string) => {
    setIsChunksLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/books/${bookId}/audio/chapters/${chId}/chunks`);
      if (res.ok) {
        const data = await res.json();
        setChunks(data);
        setActiveChunkIndex(0);
      }
    } catch (e) {
      console.error("Failed to load chapter audio chunks", e);
    } finally {
      setIsChunksLoading(false);
    }
  };

  // Sync listen progress to DB
  const handleProgressUpdate = async (position: number, speed: number) => {
    const activeCh = chapters[activeChapterIndex];
    if (!activeCh) return;
    
    try {
      await fetch(`http://localhost:8000/api/books/${bookId}/progress/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current_chapter_id: activeCh.id,
          position_seconds: position,
          speed: speed
        })
      });
    } catch (e) {
      console.error("Failed to save progress update", e);
    }
  };

  const handleNextChapter = () => {
    if (activeChapterIndex < chapters.length - 1) {
      const nextIdx = activeChapterIndex + 1;
      setActiveChapterIndex(nextIdx);
      setInitialPosition(0);
      fetchChapterChunks(chapters[nextIdx].id);
    }
  };

  const handlePrevChapter = () => {
    if (activeChapterIndex > 0) {
      const prevIdx = activeChapterIndex - 1;
      setActiveChapterIndex(prevIdx);
      setInitialPosition(0);
      fetchChapterChunks(chapters[prevIdx].id);
    }
  };

  const handleSelectChapter = (idx: number) => {
    setActiveChapterIndex(idx);
    setInitialPosition(0);
    setResumePrompt(null);
    setIsChapterListOpen(false);
    fetchChapterChunks(chapters[idx].id);
  };

  const handleResumeListening = () => {
    if (resumePrompt) {
      setInitialPosition(resumePrompt.positionSeconds);
      setResumePrompt(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:8000/api/books/${bookId}/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error("In-book search error", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleJumpToSearchResult = (result: any) => {
    const chIndex = chapters.findIndex((c) => c.id === result.chapter_id);
    if (chIndex !== -1) {
      setActiveChapterIndex(chIndex);
      // Wait, we need to seek to the approximate characters or chunk.
      // Since we just search, we can load the chapter chunks first
      setIsSearchOpen(false);
      setResumePrompt(null);
      // Calculate approximate position based on character index
      // But simplest is to load the chapter and scroll the SyncedReader.
      // We can fetch chunks and if we match the character index we set it active!
      // For now, let's load chapter first.
      setActiveChapterIndex(chIndex);
      fetchChapterChunks(result.chapter_id);
    }
  };

  // Helper formatting for resume time
  const formatResumeTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (isLoading || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="text-sm font-sans font-medium">Opening audiobook interface...</p>
      </div>
    );
  }

  const activeChapter = chapters[activeChapterIndex];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground transition-premium font-sans">
      {/* HEADER SECTION */}
      <header className="flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-6 py-4 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/library")}
            className="w-8 h-8 rounded-full border border-border/40 hover:bg-muted flex items-center justify-center transition-premium active:scale-90"
            title="Go Back to Library"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="truncate">
            <h1 className="text-sm font-bold tracking-tight truncate max-w-xs md:max-w-md">{book.title}</h1>
            <p className="text-[10px] text-muted-foreground truncate">{book.author || "Unknown Author"}</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Chapter Selector Dropdown toggle */}
          <button
            onClick={() => setIsChapterListOpen(!isChapterListOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:bg-muted text-xs font-semibold transition-premium active:scale-95"
          >
            <Menu className="w-3.5 h-3.5" />
            Chapters
          </button>

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="w-8 h-8 rounded-full border border-border/40 hover:bg-muted flex items-center justify-center transition-premium active:scale-90"
            title="Search inside book"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Collapsible Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-8 h-8 rounded-full border border-border/40 flex items-center justify-center transition-premium active:scale-90 ${
              isSidebarOpen ? "bg-muted text-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
            title="Toggle AI notes panel"
          >
            <Sidebar className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* CHAPTER NAV DRAWER */}
        {isChapterListOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsChapterListOpen(false)}></div>
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border p-6 shadow-2xl z-50 transition-premium flex flex-col">
              <h3 className="font-bold text-sm mb-4 border-b border-border pb-3">Table of Contents</h3>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => handleSelectChapter(idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition-premium ${
                      idx === activeChapterIndex
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="truncate max-w-[200px]">{ch.title}</span>
                    {idx === activeChapterIndex && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* SEARCH DRAWER */}
        {isSearchOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setIsSearchOpen(false)}></div>
            <div className="absolute right-0 top-0 bottom-0 w-80 md:w-96 bg-card border-l border-border p-6 shadow-2xl z-50 transition-premium flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <h3 className="font-bold text-sm">Search Book Contents</h3>
                <button onClick={() => setIsSearchOpen(false)} className="text-muted-foreground hover:text-foreground text-xs font-semibold">Close</button>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Enter keyword or concept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold">Search</button>
              </form>

              {/* Results area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {isSearching ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching pages...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-10">
                    No results found. Type a query above.
                  </div>
                ) : (
                  searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => handleJumpToSearchResult(res)}
                      className="p-3 bg-muted/40 hover:bg-muted/80 border border-border/60 rounded-2xl cursor-pointer transition-premium text-xs"
                    >
                      <div className="flex justify-between text-[10px] text-primary font-bold uppercase tracking-wider mb-1.5">
                        <span>{res.chapter_title}</span>
                        {res.page_number !== null && <span>Page {res.page_number + 1}</span>}
                      </div>
                      <p className="text-muted-foreground leading-relaxed line-clamp-3 italic">
                        {res.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* MIDDLE SECTION - SYNCED READER */}
        <div className="flex-1 overflow-y-auto pb-40 relative bg-background/50">
          
          {/* RESUME PROGRESS PROMPT */}
          {resumePrompt && (
            <div className="m-6 p-4 bg-primary/[0.03] border border-primary/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-primary flex-shrink-0 animate-pulse" />
                <div className="text-xs">
                  <p className="font-bold">Continue listening from your last position?</p>
                  <p className="text-muted-foreground mt-0.5">
                    Chapter: {resumePrompt.chapterTitle} at {formatResumeTime(resumePrompt.positionSeconds)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setResumePrompt(null)} 
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
                >
                  Dismiss
                </button>
                <button 
                  onClick={handleResumeListening} 
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-premium shadow-md"
                >
                  Resume Listening
                </button>
              </div>
            </div>
          )}

          {isChunksLoading ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs">Loading page texts...</p>
            </div>
          ) : (
            <SyncedReader
              chunks={chunks}
              activeChunkIndex={activeChunkIndex}
              onChunkClick={(idx) => {
                // Seek player to the beginning of this chunk
                let accumulatedTime = 0;
                for (let i = 0; i < idx; i++) {
                  accumulatedTime += chunks[i]?.duration || 0;
                }
                setInitialPosition(accumulatedTime);
                setActiveChunkIndex(idx);
              }}
            />
          )}
        </div>

        {/* SIDEBAR SECTION - AI NOTES & ASSISTANT */}
        {isSidebarOpen && activeChapter && (
          <aside className="w-80 md:w-96 h-full flex-shrink-0 flex flex-col border-l border-border/40 bg-card overflow-hidden">
            {/* Sidebar Tabs Headers */}
            <div className="flex border-b border-border/40 bg-muted/20">
              <button
                onClick={() => setActiveSidebarTab("ai")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-premium ${
                  activeSidebarTab === "ai"
                    ? "border-primary text-primary bg-background/50"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Assistant
              </button>
              
              <button
                onClick={() => setActiveSidebarTab("bookmarks")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-premium ${
                  activeSidebarTab === "bookmarks"
                    ? "border-primary text-primary bg-background/50"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Bookmarks
              </button>
            </div>

            {/* Sidebar Content Area */}
            <div className="flex-1 min-h-0">
              {activeSidebarTab === "ai" ? (
                <AiAssistant
                  bookId={bookId}
                  chapterId={activeChapter.id}
                  chapterTitle={activeChapter.title}
                />
              ) : (
                <BookmarksPanel
                  bookId={bookId}
                  activeChapterId={activeChapter.id}
                  activeChapterTitle={activeChapter.title}
                  chunks={chunks}
                  activeChunkIndex={activeChunkIndex}
                  onSeekToChunk={(idx) => {
                    // Seek player to the beginning of this chunk
                    let accumulatedTime = 0;
                    for (let i = 0; i < idx; i++) {
                      accumulatedTime += chunks[i]?.duration || 0;
                    }
                    setInitialPosition(accumulatedTime);
                    setActiveChunkIndex(idx);
                  }}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* FLOATING/STICKY PLAYER FOOTER */}
      {activeChapter && (
        <div className="fixed bottom-6 left-6 right-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[700px] z-40 p-1.5 rounded-[2.5rem] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 shadow-2xl backdrop-blur-md transition-premium">
          <AudioPlayer
            bookId={bookId}
            chapterId={activeChapter.id}
            chapterTitle={activeChapter.title}
            chunks={chunks}
            initialPosition={initialPosition}
            onProgressUpdate={handleProgressUpdate}
            onChunkActive={(idx, text) => {
              setActiveChunkIndex(idx);
              setActiveChunkText(text);
            }}
            onNextChapter={handleNextChapter}
            onPrevChapter={handlePrevChapter}
          />
        </div>
      )}
    </div>
  );
}
