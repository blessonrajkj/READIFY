"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Clock, ListChecks, KeyRound, Loader2, Sparkles, ChevronRight } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  duration: number;
  start_page: number | null;
  end_page: number | null;
}

interface ChapterSummaryData {
  summary: string;
  key_takeaways: string[];
  important_concepts: Array<{ term: string; definition: string } | string>;
  estimated_minutes: number;
}

interface ChapterSummariesWorkspaceProps {
  bookId: string;
  chapters: Chapter[];
}

export default function ChapterSummariesWorkspace({ bookId, chapters }: ChapterSummariesWorkspaceProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(chapters[0]?.id || "");
  const [summaryData, setSummaryData] = useState<ChapterSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedChapterId) {
      loadSummary(selectedChapterId);
    }
  }, [bookId, selectedChapterId]);

  const loadSummary = async (chId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/assistant/chapters/${chId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (err) {
      console.error("Failed to load chapter summary", err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  return (
    <div className="w-full space-y-8">
      {/* Chapter Selection Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-muted/20 border border-border/40">
        <div>
          <h2 className="text-lg font-bold">Chapter Summaries & Key Arguments</h2>
          <p className="text-xs text-muted-foreground">
            Structured breakdown of core takeaways, executive summaries, and terminology.
          </p>
        </div>

        <select
          value={selectedChapterId}
          onChange={(e) => setSelectedChapterId(e.target.value)}
          className="px-4 py-2 rounded-xl text-xs bg-card border border-border/60 text-foreground font-semibold focus:outline-none"
        >
          {chapters.map(ch => (
            <option key={ch.id} value={ch.id}>
              Chapter {ch.chapter_number}: {ch.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-xs">Loading chapter analysis...</p>
        </div>
      ) : summaryData ? (
        <div className="space-y-6">
          {/* Chapter Meta Highlights */}
          <div className="p-6 rounded-3xl bg-card border border-border/40 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-primary tracking-wider">
                Chapter {currentChapter?.chapter_number}
              </span>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{currentChapter?.title}</h3>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> ~{summaryData.estimated_minutes} min read
              </span>
              {currentChapter?.start_page !== null && currentChapter?.end_page !== null && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Pages {currentChapter.start_page + 1}–{currentChapter.end_page + 1}
                </span>
              )}
            </div>
          </div>

          {/* Executive Summary Card */}
          <div className="double-bezel-outer">
            <div className="p-6 md:p-8 double-bezel-inner space-y-3">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Executive Summary
              </div>
              <p className="text-xs md:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {summaryData.summary}
              </p>
            </div>
          </div>

          {/* Core Takeaways */}
          {summaryData.key_takeaways && summaryData.key_takeaways.length > 0 && (
            <div className="p-6 md:p-8 rounded-3xl bg-card border border-border/40 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider">
                <ListChecks className="w-4 h-4 text-emerald-500" /> Core Arguments & Lessons
              </div>
              <ul className="space-y-2.5 text-xs md:text-sm text-muted-foreground">
                {summaryData.key_takeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-foreground/90">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Terminology & Concepts */}
          {summaryData.important_concepts && summaryData.important_concepts.length > 0 && (
            <div className="p-6 md:p-8 rounded-3xl bg-card border border-border/40 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-indigo-500" /> Key Concepts Glossary
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {summaryData.important_concepts.map((item, idx) => {
                  const isObj = typeof item === "object" && item !== null;
                  const term = isObj ? (item as any).term : `Concept ${idx + 1}`;
                  const def = isObj ? (item as any).definition : String(item);
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                      <h4 className="text-xs font-bold text-primary">{term}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{def}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-xs text-muted-foreground">
          No summary data found for this chapter.
        </div>
      )}
    </div>
  );
}
