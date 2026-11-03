"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Sparkles, Plus, Pin, Trash2, 
  Copy, Check, Loader2, BookOpen, Edit3, X
} from "lucide-react";

interface StudyNote {
  id: string;
  book_id: string;
  chapter_id: string | null;
  title: string;
  content: string;
  tags: string[];
  color: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
}

interface StudyNotesWorkspaceProps {
  bookId: string;
  chapters: Chapter[];
}

export default function StudyNotesWorkspace({ bookId, chapters }: StudyNotesWorkspaceProps) {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Note Form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newChapterId, setNewChapterId] = useState<string>("");

  useEffect(() => {
    loadNotes();
  }, [bookId, selectedChapterId]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const url = selectedChapterId === "all"
        ? `/api/books/${bookId}/learning/notes`
        : `/api/books/${bookId}/learning/notes?chapter_id=${selectedChapterId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (data.length > 0 && !selectedNote) {
          setSelectedNote(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load study notes", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNotes = async () => {
    setIsGenerating(true);
    try {
      const targetCh = selectedChapterId === "all" ? (chapters[0]?.id || null) : selectedChapterId;
      const url = targetCh 
        ? `/api/books/${bookId}/learning/notes/generate?chapter_id=${targetCh}`
        : `/api/books/${bookId}/learning/notes/generate`;
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        setSelectedNote(newNote);
      }
    } catch (err) {
      console.error("Failed to generate notes", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCustomNote = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const res = await fetch(`/api/books/${bookId}/learning/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_id: newChapterId || null,
          title: newTitle,
          content: newContent,
          tags: ["User Note"]
        })
      });
      if (res.ok) {
        const note = await res.json();
        setNotes(prev => [note, ...prev]);
        setSelectedNote(note);
        setIsCreatingCustom(false);
        setNewTitle("");
        setNewContent("");
      }
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/books/${bookId}/learning/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !currentPinned })
      });
      if (res.ok) {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: !currentPinned } : n));
        if (selectedNote?.id === noteId) {
          setSelectedNote(prev => prev ? { ...prev, is_pinned: !currentPinned } : null);
        }
      }
    } catch (err) {
      console.error("Failed to toggle pin", err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this study note?")) return;
    try {
      const res = await fetch(`/api/books/${bookId}/learning/notes/${noteId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(notes.find(n => n.id !== noteId) || null);
        }
      }
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  const handleCopyNote = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-muted/20 border border-border/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Study Notes & Revision</h2>
            <p className="text-xs text-muted-foreground">
              Executive summaries, key concepts, core arguments, and personalized revision notes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs bg-card border border-border/60 text-foreground focus:outline-none"
          >
            <option value="all">All Chapters</option>
            {chapters.map(ch => (
              <option key={ch.id} value={ch.id}>{ch.title}</option>
            ))}
          </select>

          <button
            onClick={() => setIsCreatingCustom(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-premium"
          >
            <Plus className="w-3.5 h-3.5" /> New Note
          </button>

          <button
            onClick={handleGenerateNotes}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-premium shadow-md disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isGenerating ? "Synthesizing..." : "Generate AI Notes"}
          </button>
        </div>
      </div>

      {/* Main Dual-Column Split (Notes List on Left, Active Note Editor/Viewer on Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Notes List */}
        <div className="md:col-span-1 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border/60 text-center text-xs text-muted-foreground">
              No notes yet. Click <strong>Generate AI Notes</strong> to extract key takeaways.
            </div>
          ) : (
            notes.map(note => {
              const isSelected = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-4 rounded-2xl cursor-pointer transition-premium border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card border-border/40 hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold truncate max-w-[180px]">{note.title}</h3>
                    {note.is_pinned && <Pin className="w-3 h-3 rotate-45 flex-shrink-0" />}
                  </div>
                  <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}>
                    {note.content.replace(/^[#*-]\s+/gm, "")}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Note Viewer */}
        <div className="md:col-span-2">
          {selectedNote ? (
            <div className="double-bezel-outer">
              <div className="p-6 md:p-8 double-bezel-inner space-y-6">
                {/* Note Actions Bar */}
                <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-foreground">{selectedNote.title}</h2>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Last edited {new Date(selectedNote.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePin(selectedNote.id, selectedNote.is_pinned)}
                      className={`p-2 rounded-lg hover:bg-muted transition-premium ${selectedNote.is_pinned ? "text-primary" : "text-muted-foreground"}`}
                      title="Pin note"
                    >
                      <Pin className="w-4 h-4 rotate-45" />
                    </button>
                    <button
                      onClick={() => handleCopyNote(selectedNote.content, selectedNote.id)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-premium"
                      title="Copy content"
                    >
                      {copiedId === selectedNote.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteNote(selectedNote.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-premium"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Note Markdown Content Body */}
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs md:text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                  {selectedNote.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 rounded-3xl border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground">
              Select or generate a note to view details.
            </div>
          )}
        </div>
      </div>

      {/* New Custom Note Modal */}
      {isCreatingCustom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Create Study Note</h3>
              <button onClick={() => setIsCreatingCustom(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Note Title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-muted border border-border/40 text-xs font-semibold focus:outline-none"
              />

              <select
                value={newChapterId}
                onChange={(e) => setNewChapterId(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-muted border border-border/40 text-xs text-muted-foreground focus:outline-none"
              >
                <option value="">Attach to Chapter (Optional)</option>
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.title}</option>
                ))}
              </select>

              <textarea
                rows={8}
                placeholder="Write your study notes, insights, key formulas..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border/40 text-xs focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreatingCustom(false)}
                className="px-4 py-2 rounded-xl hover:bg-muted text-xs text-muted-foreground font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomNote}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-premium shadow-md"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
