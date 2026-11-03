"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Check, RotateCcw, ChevronLeft, ChevronRight, 
  Plus, Loader2, Layers, BookOpen, Trash2, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Flashcard {
  id: string;
  book_id: string;
  chapter_id: string | null;
  front: string;
  back: string;
  category: string;
  difficulty: string;
  source_page: number | null;
  is_mastered: boolean;
  review_count: number;
  last_reviewed_at: string | null;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
}

interface FlashcardsWorkspaceProps {
  bookId: string;
  chapters: Chapter[];
}

export default function FlashcardsWorkspace({ bookId, chapters }: FlashcardsWorkspaceProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "learning" | "mastered">("all");

  useEffect(() => {
    loadFlashcards();
  }, [bookId, selectedChapterId]);

  const loadFlashcards = async () => {
    setIsLoading(true);
    try {
      const url = selectedChapterId === "all" 
        ? `/api/books/${bookId}/learning/flashcards`
        : `/api/books/${bookId}/learning/flashcards?chapter_id=${selectedChapterId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error("Failed to load flashcards", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const targetCh = selectedChapterId === "all" ? (chapters[0]?.id || null) : selectedChapterId;
      const url = targetCh 
        ? `/api/books/${bookId}/learning/flashcards/generate?chapter_id=${targetCh}&count=8`
        : `/api/books/${bookId}/learning/flashcards/generate?count=8`;
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        await loadFlashcards();
      }
    } catch (err) {
      console.error("Failed to generate flashcards", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleMastery = async (cardId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/books/${bookId}/learning/flashcards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_mastered: !currentStatus })
      });
      if (res.ok) {
        setFlashcards(prev => prev.map(c => c.id === cardId ? { ...c, is_mastered: !currentStatus, review_count: c.review_count + 1 } : c));
        // Move to next card
        if (currentIndex < filteredCards.length - 1) {
          handleNext();
        }
      }
    } catch (err) {
      console.error("Failed to update flashcard mastery", err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/books/${bookId}/learning/flashcards/${cardId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setFlashcards(prev => prev.filter(c => c.id !== cardId));
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
      }
    } catch (err) {
      console.error("Failed to delete card", err);
    }
  };

  const filteredCards = flashcards.filter(c => {
    if (filterMode === "mastered") return c.is_mastered;
    if (filterMode === "learning") return !c.is_mastered;
    return true;
  });

  const currentCard = filteredCards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const masteredCount = flashcards.filter(c => c.is_mastered).length;
  const progressPercent = flashcards.length > 0 ? Math.round((masteredCount / flashcards.length) * 100) : 0;

  return (
    <div className="w-full space-y-8">
      {/* Top Controls & Deck Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-muted/20 border border-border/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Study Flashcards</h2>
            <p className="text-xs text-muted-foreground">
              {flashcards.length} Cards in deck • {masteredCount} Mastered ({progressPercent}%)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chapter Selector */}
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

          {/* Filter Mode */}
          <div className="flex rounded-xl bg-muted p-0.5 text-xs">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg transition-premium ${filterMode === "all" ? "bg-card shadow-sm font-semibold" : "text-muted-foreground"}`}
            >
              All ({flashcards.length})
            </button>
            <button
              onClick={() => setFilterMode("learning")}
              className={`px-3 py-1.5 rounded-lg transition-premium ${filterMode === "learning" ? "bg-card shadow-sm font-semibold text-amber-500" : "text-muted-foreground"}`}
            >
              To Learn ({flashcards.length - masteredCount})
            </button>
            <button
              onClick={() => setFilterMode("mastered")}
              className={`px-3 py-1.5 rounded-lg transition-premium ${filterMode === "mastered" ? "bg-card shadow-sm font-semibold text-emerald-500" : "text-muted-foreground"}`}
            >
              Mastered ({masteredCount})
            </button>
          </div>

          {/* AI Generator Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-premium shadow-md disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isGenerating ? "Generating..." : "Generate AI Cards"}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-500 rounded-full transition-premium duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Flashcard Active View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
          <p className="text-xs">Loading flashcards...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="border border-dashed border-border rounded-3xl p-16 text-center text-muted-foreground bg-muted/10">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <h3 className="text-base font-bold text-foreground">No Flashcards in this view</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {filterMode === "mastered" ? "You haven't marked any cards as mastered yet." : "Generate automated terminology and concept flashcards with AI."}
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:scale-105 active:scale-95 transition-premium shadow-lg"
          >
            <Sparkles className="w-4 h-4" /> Generate Flashcards
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto flex flex-col items-center">
          {/* Card Meta Indicator */}
          <div className="w-full flex items-center justify-between text-xs text-muted-foreground mb-3 px-2">
            <span className="font-mono">Card {currentIndex + 1} of {filteredCards.length}</span>
            <span className="capitalize px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted border border-border/40">
              {currentCard.category} • {currentCard.difficulty}
            </span>
          </div>

          {/* Interactive 3D Flip Card Container */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 sm:h-96 cursor-pointer select-none perspective-1000 group relative"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              style={{ transformStyle: "preserve-3d" }}
              className="w-full h-full relative double-bezel-outer"
            >
              {/* Front Face */}
              <div 
                style={{ backfaceVisibility: "hidden" }}
                className="absolute inset-0 p-8 double-bezel-inner flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-primary font-bold">Front • Question</span>
                  {currentCard.source_page && (
                    <span className="text-[10px]">Page {currentCard.source_page}</span>
                  )}
                </div>

                <div className="my-auto text-center px-4">
                  <p className="text-lg md:text-xl font-bold tracking-tight text-foreground leading-relaxed">
                    {currentCard.front}
                  </p>
                </div>

                <div className="text-center text-[11px] text-muted-foreground/60 flex items-center justify-center gap-1.5">
                  <RotateCcw className="w-3 h-3" /> Click card to reveal answer
                </div>
              </div>

              {/* Back Face */}
              <div 
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                className="absolute inset-0 p-8 double-bezel-inner flex flex-col justify-between bg-card"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 font-bold">Back • Answer</span>
                  {currentCard.is_mastered && (
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mastered
                    </span>
                  )}
                </div>

                <div className="my-auto text-center px-4">
                  <p className="text-sm md:text-base leading-relaxed text-foreground font-medium">
                    {currentCard.back}
                  </p>
                </div>

                <div className="text-center text-[11px] text-muted-foreground/60 flex items-center justify-center gap-1.5">
                  <RotateCcw className="w-3 h-3" /> Click to flip back
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons below card */}
          <div className="w-full flex items-center justify-between mt-6 px-2 gap-3">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full hover:bg-muted text-foreground transition-premium border border-border/40 active:scale-95"
              title="Previous card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleMastery(currentCard.id, currentCard.is_mastered)}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold transition-premium active:scale-95 shadow-sm ${
                  currentCard.is_mastered
                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                }`}
              >
                <Check className="w-4 h-4" />
                {currentCard.is_mastered ? "Mark as Reviewing" : "Mastered"}
              </button>

              <button
                onClick={() => handleDeleteCard(currentCard.id)}
                className="p-2.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-premium active:scale-90"
                title="Delete card"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleNext}
              className="p-3 rounded-full hover:bg-muted text-foreground transition-premium border border-border/40 active:scale-95"
              title="Next card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
