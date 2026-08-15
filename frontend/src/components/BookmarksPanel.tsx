"use client";

import React, { useState, useEffect } from "react";
import { Bookmark as BookmarkIcon, Trash2, Plus, ArrowRight, CornerDownRight } from "lucide-react";

interface AudioChunk {
  chunk_id: string;
  text: string;
  chunk_index: number;
  page_number: number | null;
  audio_url: string | null;
  status: string;
  duration: number;
}

interface Bookmark {
  id: string;
  chapterId: string;
  chapterTitle: string;
  chunkIndex: number;
  textSnippet: string;
  noteText: string;
  createdAt: string;
}

interface BookmarksPanelProps {
  bookId: string;
  activeChapterId: string;
  activeChapterTitle: string;
  chunks: AudioChunk[];
  activeChunkIndex: number;
  onSeekToChunk: (chunkIndex: number) => void;
}

export default function BookmarksPanel({
  bookId,
  activeChapterId,
  activeChapterTitle,
  chunks,
  activeChunkIndex,
  onSeekToChunk
}: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newNote, setNewNote] = useState("");
  const localStorageKey = `readify-bookmarks-${bookId}`;

  // Load bookmarks on mount or when bookId changes
  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    } else {
      setBookmarks([]);
    }
  }, [bookId, localStorageKey]);

  const saveBookmarksList = (list: Bookmark[]) => {
    setBookmarks(list);
    localStorage.setItem(localStorageKey, JSON.stringify(list));
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (chunks.length === 0) return;

    const currentChunk = chunks[activeChunkIndex] || chunks[0];
    const snippet = currentChunk.text.substring(0, 120) + (currentChunk.text.length > 120 ? "..." : "");

    const newBookmark: Bookmark = {
      id: Math.random().toString(36).substring(2, 9),
      chapterId: activeChapterId,
      chapterTitle: activeChapterTitle,
      chunkIndex: activeChunkIndex,
      textSnippet: snippet,
      noteText: newNote.trim(),
      createdAt: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    saveBookmarksList([newBookmark, ...bookmarks]);
    setNewNote("");
  };

  const handleDeleteBookmark = (id: string) => {
    saveBookmarksList(bookmarks.filter((b) => b.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border/40 font-sans">
      {/* Panel Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/[0.01]">
        <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
          <BookmarkIcon className="w-4 h-4 text-primary" /> Bookmarks & Notes
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
          {bookmarks.length} saved
        </span>
      </div>

      {/* Add Note Form - Double Bezel Layout */}
      <div className="p-4 border-b border-border/40 bg-muted/[0.02]">
        <form onSubmit={handleAddBookmark} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
              Add Bookmark at Current Position
            </label>
            {chunks[activeChunkIndex] && (
              <div className="p-2.5 rounded-xl border border-border/40 bg-muted/20 text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                "{chunks[activeChunkIndex].text}"
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add personal note/highlight details..."
              className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-premium"
            />
            <button
              type="submit"
              disabled={chunks.length === 0}
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:scale-105 active:scale-95 transition-premium flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              <Plus className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </form>
      </div>

      {/* Bookmarks Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <BookmarkIcon className="w-8 h-8 opacity-20 mb-2" />
            <h4 className="text-xs font-bold text-foreground">No bookmarks saved yet</h4>
            <p className="text-[10px] max-w-[180px] mt-1 leading-relaxed">
              Bookmark important quotes or add study notes as you read along.
            </p>
          </div>
        ) : (
          bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="group p-1 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md transition-premium"
            >
              <div className="p-3.5 rounded-[calc(1rem-0.125rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col justify-between gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground font-semibold">
                      {bm.chapterTitle}
                    </span>
                    <p className="text-xs font-serif text-muted-foreground/80 line-clamp-2 mt-1 leading-relaxed">
                      "{bm.textSnippet}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBookmark(bm.id)}
                    className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-premium active:scale-90"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {bm.noteText && (
                  <div className="flex items-start gap-1.5 p-2 rounded-xl bg-muted/40 text-xs font-sans text-foreground">
                    <CornerDownRight className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">
                      <span className="font-semibold text-primary/70">Note: </span>
                      {bm.noteText}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-0.5">
                  <span className="text-[9px] font-mono text-muted-foreground/60">
                    {bm.createdAt}
                  </span>
                  
                  <button
                    onClick={() => onSeekToChunk(bm.chunkIndex)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-[10px] font-bold transition-premium active:scale-95 shadow-sm"
                  >
                    Jump to paragraph <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
