"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Clock, BookOpen, Edit3, Trash2, Loader2, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import CoverImage from "@/components/CoverImage";

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

export default function BookDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id: bookId } = use(params);

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Chapter editing
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    loadBookData();
  }, [bookId]);

  const loadBookData = async () => {
    setIsLoading(true);
    try {
      const bookRes = await fetch(`http://localhost:8000/api/books/${bookId}`);
      if (!bookRes.ok) throw new Error("Failed to load book");
      const bookData = await bookRes.json();
      setBook(bookData);

      const chRes = await fetch(`http://localhost:8000/api/books/${bookId}/chapters/`);
      if (!chRes.ok) throw new Error("Failed to load chapters");
      const chData = await chRes.json();
      setChapters(chData);

      // Fetch listening progress
      const progRes = await fetch(`http://localhost:8000/api/books/${bookId}/progress/`);
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
      const res = await fetch(`http://localhost:8000/api/books/${bookId}/chapters/${chapterId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: editTitle
        })
      });
      if (res.ok) {
        setEditingChapterId(null);
        // Refresh chapter list
        loadBookData();
      }
    } catch (err) {
      console.error("Failed to rename chapter", err);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/books/${bookId}/chapters/${chapterId}`, {
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

  if (isLoading || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="text-sm font-sans">Loading book profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-premium font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-28">
        {/* Back Link */}
        <Link href="/library" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-8 w-max transition-premium">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>

        {/* Book Overview Block ( editorial split ) */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start mb-12">
          {/* Cover Left */}
          <div className="w-44 md:w-52 h-60 md:h-72 shadow-2xl rounded-[2rem] overflow-hidden flex-shrink-0 mx-auto md:mx-0">
            <CoverImage title={book.title} author={book.author || "Unknown"} coverPath={book.cover_path || undefined} />
          </div>

          {/* Details Right */}
          <div className="flex-1 flex flex-col justify-between self-stretch py-2 text-center md:text-left">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">{book.title}</h1>
              <p className="text-sm md:text-base text-muted-foreground/80 mt-1">{book.author || "Unknown Author"}</p>
              
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {book.total_pages} Pages</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {chapters.length} Chapters</span>
              </div>
            </div>

            {/* Progress and play action */}
            <div className="mt-8 space-y-4 max-w-sm mx-auto md:mx-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold">Overall Progress</span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-premium" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/book/${book.id}/read`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:scale-105 active:scale-95 transition-premium shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  Start listening
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="border-t border-border pt-10">
          <h2 className="text-xl font-bold tracking-tight mb-6">Chapters</h2>

          {chapters.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-10">
              No chapters generated for this book yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chapters.map((ch, idx) => {
                const isEditing = editingChapterId === ch.id;
                return (
                  // Double bezel list item
                  <div key={ch.id} className="p-1 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:shadow-sm transition-premium">
                    <div className="px-5 py-4 rounded-xl bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-between gap-4">
                      
                      {/* Left: Number and Title */}
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

                      {/* Right: Duration and Edit buttons */}
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(ch.duration)}
                        </span>

                        {!isEditing && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingChapterId(ch.id);
                                setEditTitle(ch.title);
                              }}
                              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-premium active:scale-90"
                              title="Rename Chapter"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(ch.id)}
                              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive transition-premium active:scale-90"
                              title="Delete Chapter"
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
      </main>
    </div>
  );
}
