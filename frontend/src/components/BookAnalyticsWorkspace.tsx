"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart2, Clock, Headphones, BookOpen, 
  Award, Layers, AlertCircle, CheckCircle2, TrendingUp, Loader2
} from "lucide-react";

interface BookAnalytics {
  total_listening_seconds: number;
  total_reading_seconds: number;
  total_study_minutes: number;
  chapters_completed: number;
  quizzes_taken: number;
  avg_quiz_score: number;
  flashcards_reviewed: number;
  flashcards_mastered: number;
  learning_streak_days: number;
  weak_topics: string[];
  retention_score: number;
}

interface BookAnalyticsWorkspaceProps {
  bookId: string;
}

export default function BookAnalyticsWorkspace({ bookId }: BookAnalyticsWorkspaceProps) {
  const [analytics, setAnalytics] = useState<BookAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [bookId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics/books/${bookId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to load book analytics", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHoursMinutes = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
        <p className="text-xs">Computing retention & learning analytics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  const totalSecs = analytics.total_listening_seconds + analytics.total_reading_seconds;
  const listeningPercent = totalSecs > 0 ? Math.round((analytics.total_listening_seconds / totalSecs) * 100) : 50;
  const readingPercent = totalSecs > 0 ? 100 - listeningPercent : 50;

  return (
    <div className="w-full space-y-8">
      {/* Retention Score Hero Banner */}
      <div className="double-bezel-outer">
        <div className="p-8 double-bezel-inner flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" /> Comprehensive Knowledge Retention
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {analytics.retention_score >= 80 ? "Deep Mastery Achieved" : analytics.retention_score >= 50 ? "Solid Comprehension" : "Early Learning Phase"}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-md">
              Score computed based on practice test accuracy, flashcard mastery, and synchronized reading retention.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/40 border border-border/40">
            <span className="text-4xl font-extrabold text-foreground font-mono">
              {analytics.retention_score}%
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Retention Index</span>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Listening Time */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
            <Headphones className="w-4 h-4 text-primary" /> Total Listening
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {formatHoursMinutes(analytics.total_listening_seconds)}
          </div>
        </div>

        {/* Reading Time */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
            <BookOpen className="w-4 h-4 text-emerald-500" /> Total Reading
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {formatHoursMinutes(analytics.total_reading_seconds)}
          </div>
        </div>

        {/* Quiz Accuracy */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
            <Award className="w-4 h-4 text-amber-500" /> Quiz Accuracy
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {analytics.quizzes_taken > 0 ? `${analytics.avg_quiz_score}%` : "No tests"}
          </div>
          <span className="text-[10px] text-muted-foreground">{analytics.quizzes_taken} Assessments taken</span>
        </div>

        {/* Flashcards Mastered */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
            <Layers className="w-4 h-4 text-indigo-500" /> Flashcards
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {analytics.flashcards_mastered} Mastered
          </div>
          <span className="text-[10px] text-muted-foreground">{analytics.flashcards_reviewed} Total reviews</span>
        </div>
      </div>

      {/* Reading vs Listening Ratio & Weak Concepts Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ratio Card */}
        <div className="p-6 rounded-3xl bg-card border border-border/40 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold">Study Modality Breakdown</h3>
          <p className="text-xs text-muted-foreground">
            Compare your time spent reading synchronized text vs listening to audio narration.
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-primary font-bold">Audio: {listeningPercent}%</span>
              <span className="text-emerald-500 font-bold">Text: {readingPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
              <div className="bg-primary h-full transition-premium" style={{ width: `${listeningPercent}%` }} />
              <div className="bg-emerald-500 h-full transition-premium" style={{ width: `${readingPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Weak Topics Card */}
        <div className="p-6 rounded-3xl bg-card border border-border/40 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" /> Concepts Requiring Revision
          </div>
          <p className="text-xs text-muted-foreground">
            Topics and questions where practice test performance fell below target accuracy.
          </p>

          {analytics.weak_topics && analytics.weak_topics.length > 0 ? (
            <ul className="space-y-2 text-xs text-foreground">
              {analytics.weak_topics.map((topic, i) => (
                <li key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span className="line-clamp-2">{topic}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              No persistent weak topics detected! Keep testing regularly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
