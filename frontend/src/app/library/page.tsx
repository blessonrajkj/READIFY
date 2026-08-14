"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Play, Trash2, RefreshCw, Edit3, MoreVertical, 
  BookOpen, CheckCircle, Clock, Plus, Loader2 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CoverImage from "@/components/CoverImage";

interface Book {
  id: string;
  title: string;
  author: string | null;
  filename: string;
  filepath: string;
  cover_path: string | null;
  language: string;
  status: string;
  total_pages: number;
  file_size: number;
  created_at: string;
}

interface ProgressMap {
  [bookId: string]: {
    chapterTitle: string;
    percent: number;
  };
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Rename states
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameAuthor, setRenameAuthor] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/books/");
      if (res.ok) {
        const booksData = await res.json();
        setBooks(booksData);
        // Load progress for each book
        fetchProgressMap(booksData);
      }
    } catch (err) {
      console.error("Failed to load library books", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgressMap = async (booksList: Book[]) => {
    const progMap: ProgressMap = {};
    for (const b of booksList) {
      try {
        // Load active listening progress
        const res = await fetch(`http://localhost:8000/api/books/${b.id}/progress/`);
        if (res.ok) {
          const pData = await res.json();
          // Load chapters to evaluate percentage
          const chRes = await fetch(`http://localhost:8000/api/books/${b.id}/chapters/`);
          if (chRes.ok) {
            const chapters = await chRes.json();
            
            // Calculate percentage based on order index
            let percent = 0;
            let currentChapterTitle = "Start Listening";
            
            if (chapters.length > 0) {
              const activeCh = chapters.find((c: any) => c.id === pData.current_chapter_id) || chapters[0];
              currentChapterTitle = activeCh.title;
              
              const activeIdx = chapters.indexOf(activeCh);
              // Percentage progress by chapter completions + offset in current
              percent = Math.round(((activeIdx + (pData.position_seconds / (activeCh.duration || 1))) / chapters.length) * 100);
              percent = Math.min(100, Math.max(0, percent));
            }
            
            progMap[b.id] = {
              chapterTitle: currentChapterTitle,
              percent: percent
            };
          }
        }
      } catch (e) {
        console.error(`Failed to load progress for book ${b.id}`, e);
      }
    }
    setProgress(progMap);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book? This will permanently remove all audio chunks.")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/books/${bookId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
      }
    } catch (err) {
      console.error("Failed to delete book", err);
    }
  };

  const handleReprocessBook = async (bookId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/books/${bookId}/reprocess`, {
        method: "POST"
      });
      if (res.ok) {
        alert("Reprocessing triggered! Check status in upload progress.");
        fetchBooks();
      }
    } catch (err) {
      console.error("Failed to reprocess book", err);
    }
  };

  const handleSaveRename = async (bookId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/books/${bookId}/reprocess`, {
        // Wait, we can patch metadata directly or using a config endpoint
        // Let's call patch on books endpoint
      });
      // Simple implementation: send a PATCH request to /api/books/{id}
      const patchRes = await fetch(`http://localhost:8000/api/books/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: renameTitle,
          author: renameAuthor
        })
      });
      if (patchRes.ok) {
        setRenamingId(null);
        fetchBooks();
      }
    } catch (err) {
      console.error("Failed to rename book", err);
    }
  };

  // Compute metrics
  const totalBooks = books.length;
  const processingBooks = books.filter((b) => b.status === "processing" || b.status === "pending").length;
  const completedBooks = books.filter((b) => b.status === "completed").length;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-premium font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-28">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Your Library</h1>
            <p className="text-xs md:text-sm text-muted-foreground/80 mt-1">Manage and listen to your uploaded audiobooks.</p>
          </div>
          <Link href="/upload" className="group rounded-full bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 flex items-center gap-1.5 transition-premium hover:scale-105 active:scale-95 shadow-md">
            <Plus className="w-4 h-4" />
            Upload Book
          </Link>
        </div>

        {/* Dashboard Stats Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {/* Stat 1 */}
          <div className="p-1 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="p-5 rounded-[calc(1.5rem-0.25rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><BookOpen className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Total Books</div>
                <div className="text-lg font-bold">{totalBooks}</div>
              </div>
            </div>
          </div>
          {/* Stat 2 */}
          <div className="p-1 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="p-5 rounded-[calc(1.5rem-0.25rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Clock className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Processing</div>
                <div className="text-lg font-bold">{processingBooks}</div>
              </div>
            </div>
          </div>
          {/* Stat 3 */}
          <div className="p-1 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="p-5 rounded-[calc(1.5rem-0.25rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><CheckCircle className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Completed</div>
                <div className="text-lg font-bold">{completedBooks}</div>
              </div>
            </div>
          </div>
          {/* Stat 4 */}
          <div className="p-1 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="p-5 rounded-[calc(1.5rem-0.25rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Play className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Listening</div>
                <div className="text-lg font-bold">{books.filter((b) => progress[b.id]?.percent > 0 && progress[b.id]?.percent < 100).length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Books List Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm font-sans">Scanning bookshelves...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="border border-dashed border-border rounded-[2rem] p-12 text-center text-muted-foreground bg-muted/10">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <h3 className="text-base font-bold text-foreground">Your Library is Empty</h3>
            <p className="text-xs mt-1 max-w-xs mx-auto leading-relaxed">Upload your first PDF book and convert it into a neural audiobook.</p>
            <Link href="/upload" className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:scale-105 active:scale-95 transition-premium shadow-md">
              <Plus className="w-4 h-4" /> Upload first book
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {books.map((book) => {
              const bookProgress = progress[book.id] || { chapterTitle: "Start listening", percent: 0 };
              const isProcessing = book.status === "processing" || book.status === "pending";
              const isFailed = book.status === "failed";
              const isRenaming = renamingId === book.id;

              return (
                // Double Bezel card structure
                <div key={book.id} className="group p-1.5 rounded-[2rem] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 transition-premium hover:scale-[1.01] hover:shadow-2xl hover:ring-black/10 dark:hover:ring-white/20">
                  <div className="relative p-4 rounded-[calc(2rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col justify-between h-full min-h-[350px]">
                    
                    {/* Menu Button / Dropdown */}
                    <div className="absolute right-6 top-6 z-10">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === book.id ? null : book.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-card/80 border border-border/40 hover:bg-muted transition-premium text-muted-foreground hover:text-foreground active:scale-95 shadow-sm"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === book.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)}></div>
                          <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-border bg-popover p-1.5 shadow-xl z-20">
                            <button
                              onClick={() => {
                                setRenamingId(book.id);
                                setRenameTitle(book.title);
                                setRenameAuthor(book.author || "");
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-foreground hover:bg-muted transition-premium"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Rename
                            </button>
                            <button
                              onClick={() => {
                                handleReprocessBook(book.id);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-foreground hover:bg-muted transition-premium"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Reprocess
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteBook(book.id);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-destructive hover:bg-destructive/10 transition-premium"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Book Cover Container */}
                    <div className="flex justify-center mb-4 overflow-hidden rounded-2xl">
                      <div className="w-32 h-44 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.22)] rounded-2xl overflow-hidden transform group-hover:scale-[1.04] group-hover:-translate-y-1.5 transition-premium duration-500">
                        <CoverImage title={book.title} author={book.author || "Unknown"} coverPath={book.cover_path || undefined} />
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col justify-between">
                      {isRenaming ? (
                        <div className="space-y-2 mb-4">
                          <input
                            type="text"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            className="w-full bg-muted border border-border rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                            placeholder="Book Title"
                          />
                          <input
                            type="text"
                            value={renameAuthor}
                            onChange={(e) => setRenameAuthor(e.target.value)}
                            className="w-full bg-muted border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                            placeholder="Author Name"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setRenamingId(null)}
                              className="px-3 py-1.5 rounded-lg hover:bg-muted text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveRename(book.id)}
                              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <h3 className="font-bold text-sm tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-premium">
                            {book.title}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">{book.author || "Unknown Author"}</p>
                          
                          {/* Processing Badge */}
                          {isProcessing && (
                            <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              Generating Audiobook...
                            </span>
                          )}

                          {isFailed && (
                            <span className="inline-flex items-center mt-2 text-[10px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full font-medium">
                              Generation Failed
                            </span>
                          )}
                        </div>
                      )}

                      {/* Progress Bar & Actions */}
                      {!isProcessing && !isFailed && !isRenaming && (
                        <div className="space-y-3 pt-2 border-t border-border/40">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-medium truncate max-w-[120px]">{bookProgress.chapterTitle}</span>
                            <span>{bookProgress.percent}%</span>
                          </div>
                          
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-premium" 
                              style={{ width: `${bookProgress.percent}%` }}
                            ></div>
                          </div>

                          <Link
                            href={`/book/${book.id}/read`}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-semibold transition-premium active:scale-95 shadow-sm"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Continue Listening
                          </Link>
                        </div>
                      )}

                      {(isProcessing || isFailed) && (
                        <div className="pt-2 border-t border-border/40">
                          <Link
                            href={`/upload`}
                            className="w-full flex items-center justify-center py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold transition-premium"
                          >
                            View Pipeline Progress
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
