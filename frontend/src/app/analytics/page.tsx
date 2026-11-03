"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart2, Flame, Clock, Headphones, BookOpen, 
  Award, Layers, AlertCircle, ArrowRight, Loader2, 
  TrendingUp, CheckCircle2, Shield
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface GlobalAnalytics {
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

interface Book {
  id: string;
  title: string;
  author: string | null;
  total_pages: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, booksRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/books/")
      ]);

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData);
      }
      if (booksRes.ok) {
        const bData = await booksRes.json();
        setBooks(bData);
      }
    } catch (err) {
      console.error("Failed to load analytics", err);
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

  if (isLoading || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
        <p className="text-xs">Computing platform learning analytics...</p>
      </div>
    );
  }

  const totalSecs = analytics.total_listening_seconds + analytics.total_reading_seconds;
  const listeningPercent = totalSecs > 0 ? Math.round((analytics.total_listening_seconds / totalSecs) * 100) : 50;
  const readingPercent = totalSecs > 0 ? 100 - listeningPercent : 50;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-premium font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-28 space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Personal Learning Analytics</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Real-time measurement of study retention, listening habits, and quiz mastery.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-xs">
            <Flame className="w-4 h-4 fill-current animate-bounce" />
            <span>{analytics.learning_streak_days} Day Learning Streak</span>
          </div>
        </div>

        {/* Big Retention & Study Time Banner */}
        <div className="double-bezel-outer">
          <div className="p-8 double-bezel-inner flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] uppercase font-mono font-bold text-primary tracking-wider flex items-center justify-center md:justify-start gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Retention Health Index
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {analytics.retention_score}% Comprehensive Retention
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground max-w-md">
                Calculated from practice test accuracy, flashcard mastery repetitions, and reading time.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center p-4 rounded-2xl bg-muted/30 border border-border/40">
                <span className="block text-2xl font-bold font-mono">{formatHoursMinutes(totalSecs)}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Study Time</span>
              </div>
              <div className="text-center p-4 rounded-2xl bg-muted/30 border border-border/40">
                <span className="block text-2xl font-bold font-mono">{analytics.quizzes_taken}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Tests Taken</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
              <Headphones className="w-4 h-4 text-primary" /> Audio Listened
            </div>
            <div className="text-xl font-bold font-mono">
              {formatHoursMinutes(analytics.total_listening_seconds)}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
              <BookOpen className="w-4 h-4 text-emerald-500" /> Text Read
            </div>
            <div className="text-xl font-bold font-mono">
              {formatHoursMinutes(analytics.total_reading_seconds)}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
              <Award className="w-4 h-4 text-amber-500" /> Average Score
            </div>
            <div className="text-xl font-bold font-mono">
              {analytics.avg_quiz_score}%
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
              <Layers className="w-4 h-4 text-indigo-500" /> Cards Mastered
            </div>
            <div className="text-xl font-bold font-mono">
              {analytics.flashcards_mastered} / {analytics.flashcards_reviewed}
            </div>
          </div>
        </div>

        {/* Modality Ratio and Weak Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Study Modality */}
          <div className="p-6 rounded-3xl bg-card border border-border/40 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold">Study Modality Distribution</h3>
            <p className="text-xs text-muted-foreground">
              Audio listening vs synchronized text reading across your library.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-primary font-bold">Listening: {listeningPercent}%</span>
                <span className="text-emerald-500 font-bold">Reading: {readingPercent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                <div className="bg-primary h-full transition-premium" style={{ width: `${listeningPercent}%` }} />
                <div className="bg-emerald-500 h-full transition-premium" style={{ width: `${readingPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Concepts to Review */}
          <div className="p-6 rounded-3xl bg-card border border-border/40 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" /> Priority Revision Topics
            </div>
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
                No weak concepts identified. Excellent retention!
              </div>
            )}
          </div>
        </div>

        {/* Books in Library Quick Drill-down */}
        <div className="border-t border-border/40 pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Active Books in Study Queue</h3>
            <Link href="/library" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View All Books <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {books.slice(0, 6).map(b => (
              <Link 
                key={b.id} 
                href={`/book/${b.id}?tab=analytics`}
                className="p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/40 hover:shadow-md transition-premium flex items-center justify-between gap-3 group"
              >
                <div className="truncate">
                  <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-premium">
                    {b.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">{b.author || "Unknown"}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-premium flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
