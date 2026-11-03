"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Award, Clock, CheckCircle2, XCircle, 
  ArrowRight, ArrowLeft, RefreshCw, Loader2, HelpCircle, 
  AlertTriangle, BookOpen, ChevronRight, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  source_reference: string | null;
  difficulty: string;
  order_index: number;
}

interface Quiz {
  id: string;
  book_id: string;
  chapter_id: string | null;
  title: string;
  description: string | null;
  difficulty: string;
  time_limit_seconds: number;
  total_questions: number;
  created_at: string;
  questions: QuizQuestion[];
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: Record<string, number>;
  weak_topics: string[];
  duration_seconds: number;
  created_at: string;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
}

interface QuizWorkspaceProps {
  bookId: string;
  chapters: Chapter[];
}

export default function QuizWorkspace({ bookId, chapters }: QuizWorkspaceProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generator Options
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active Test State
  const [testActive, setTestActive] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, [bookId]);

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (testActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testActive, timeLeft]);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/learning/quizzes`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        chapter_id: selectedChapterId === "all" ? null : selectedChapterId,
        difficulty: selectedDifficulty,
        question_count: questionCount
      };
      const res = await fetch(`/api/books/${bookId}/learning/quizzes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newQuiz = await res.json();
        setQuizzes(prev => [newQuiz, ...prev]);
        startTest(newQuiz);
      }
    } catch (err) {
      console.error("Failed to generate quiz", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const startTest = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setTestActive(true);
    setCurrentQIndex(0);
    setUserAnswers({});
    setTimeLeft(quiz.time_limit_seconds || 300);
    setLastAttempt(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const elapsed = (activeQuiz.time_limit_seconds || 300) - timeLeft;
      const res = await fetch(`/api/books/${bookId}/learning/quizzes/${activeQuiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: userAnswers,
          duration_seconds: elapsed
        })
      });
      if (res.ok) {
        const attempt = await res.json();
        setLastAttempt(attempt);
        setTestActive(false);
      }
    } catch (err) {
      console.error("Failed to submit quiz attempt", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // =========================================================================
  // VIEW 1: ACTIVE LIVE TEST TAKING
  // =========================================================================
  if (testActive && activeQuiz && activeQuiz.questions.length > 0) {
    const q = activeQuiz.questions[currentQIndex];
    const totalQ = activeQuiz.questions.length;
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Test Header */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/40 shadow-sm">
          <div>
            <h2 className="text-sm font-bold truncate max-w-sm">{activeQuiz.title}</h2>
            <span className="text-[11px] text-muted-foreground">Question {currentQIndex + 1} of {totalQ}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
              timeLeft < 60 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-muted text-foreground"
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-premium"
            >
              {isSubmitting ? "Scoring..." : "Submit Test"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-premium"
            style={{ width: `${((currentQIndex + 1) / totalQ) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="double-bezel-outer">
          <div className="p-6 md:p-8 double-bezel-inner space-y-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base md:text-lg font-bold text-foreground leading-relaxed">
                {q.question}
              </h3>
              {q.source_reference && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded-md">
                  {q.source_reference}
                </span>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {q.options.map((opt, oIdx) => {
                const isSelected = userAnswers[q.id] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(q.id, oIdx)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left text-xs md:text-sm transition-premium border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-md"
                        : "bg-muted/30 border-border/40 hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isSelected ? "bg-primary-foreground text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span className="flex-1 leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted disabled:opacity-30 transition-premium"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs text-muted-foreground">
            {answeredCount} of {totalQ} Answered
          </span>

          {currentQIndex < totalQ - 1 ? (
            <button
              onClick={() => setCurrentQIndex(prev => Math.min(totalQ - 1, prev + 1))}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-premium"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-semibold transition-premium shadow-md shadow-emerald-500/20"
            >
              Finish & Score <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: RESULTS SCREEN (POST-TEST REVIEW & PEDAGOGICAL BREAKDOWN)
  // =========================================================================
  if (lastAttempt && activeQuiz) {
    const isPassing = lastAttempt.percentage >= 70;
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Score Banner */}
        <div className="p-8 rounded-3xl bg-card border border-border/60 text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center font-extrabold text-2xl shadow-inner border-4 ${
            isPassing ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500' : 'bg-amber-500/10 text-amber-500 border-amber-500'
          }">
            {Math.round(lastAttempt.percentage)}%
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {isPassing ? "Mastery Demonstrated!" : "Revision Recommended"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              You answered {lastAttempt.score} out of {lastAttempt.total_questions} questions correctly in {formatTime(lastAttempt.duration_seconds)}.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => startTest(activeQuiz)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-premium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retake Test
            </button>
            <button
              onClick={() => setLastAttempt(null)}
              className="px-5 py-2.5 rounded-full bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-premium"
            >
              Back to Tests
            </button>
          </div>
        </div>

        {/* Weak Topics Alert */}
        {lastAttempt.weak_topics && lastAttempt.weak_topics.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> Concepts to Review
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
              {lastAttempt.weak_topics.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h3 className="text-base font-bold">Question-by-Question Breakdown</h3>

          {activeQuiz.questions.map((q, qIdx) => {
            const userChoice = lastAttempt.answers[q.id];
            const isCorrect = userChoice === q.correct_option_index;

            return (
              <div key={q.id} className="p-6 rounded-2xl bg-card border border-border/40 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <h4 className="text-sm font-bold text-foreground">
                      {qIdx + 1}. {q.question}
                    </h4>
                  </div>
                  {q.source_reference && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {q.source_reference}
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  {q.options.map((opt, oIdx) => {
                    const isUserPick = userChoice === oIdx;
                    const isRightOption = q.correct_option_index === oIdx;

                    let badgeStyle = "bg-muted/30 text-muted-foreground border-transparent";
                    if (isRightOption) {
                      badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold";
                    } else if (isUserPick && !isRightOption) {
                      badgeStyle = "bg-red-500/10 text-red-500 border-red-500/30 line-through";
                    }

                    return (
                      <div key={oIdx} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${badgeStyle}`}>
                        <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                        {isRightOption && <span className="text-[10px] uppercase font-bold text-emerald-500">Correct Answer</span>}
                        {isUserPick && !isRightOption && <span className="text-[10px] uppercase font-bold text-red-500">Your Choice</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="p-3.5 rounded-xl bg-muted/30 text-xs text-muted-foreground leading-relaxed border border-border/30">
                  <span className="font-bold text-foreground block mb-1">Explanation:</span>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: QUIZ DASHBOARD / GENERATOR LIST
  // =========================================================================
  return (
    <div className="w-full space-y-8">
      {/* Generator Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-muted/20 border border-border/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Practice Tests & Assessments</h2>
            <p className="text-xs text-muted-foreground">
              Evaluate understanding with chapter-based MCQs, pedagogical feedback, and retention scoring.
            </p>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs bg-card border border-border/60 text-foreground focus:outline-none"
          >
            <option value="all">Full Book Assessment</option>
            {chapters.map(ch => (
              <option key={ch.id} value={ch.id}>{ch.title}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-card border border-border/60 text-foreground focus:outline-none capitalize"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <button
            onClick={handleGenerateQuiz}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-premium shadow-md disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isGenerating ? "Generating Test..." : "Generate New Test"}
          </button>
        </div>
      </div>

      {/* Quizzes List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
          <p className="text-xs">Loading practice tests...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="border border-dashed border-border rounded-3xl p-16 text-center text-muted-foreground bg-muted/10">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <h3 className="text-base font-bold text-foreground">No Practice Tests Created Yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Generate an AI-powered practice test to measure your comprehension and identify concepts that require revision.
          </p>
          <button
            onClick={handleGenerateQuiz}
            disabled={isGenerating}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:scale-105 active:scale-95 transition-premium shadow-lg"
          >
            <Sparkles className="w-4 h-4" /> Generate First Test
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="double-bezel-outer card-hover-glow transition-premium">
              <div className="p-6 double-bezel-inner flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="capitalize px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold">
                      {quiz.difficulty} Difficulty
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" /> {formatTime(quiz.time_limit_seconds || 300)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground tracking-tight">{quiz.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                    {quiz.description || "Comprehensive assessment of chapter material."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {quiz.total_questions || quiz.questions?.length || 5} Questions
                  </span>

                  <button
                    onClick={() => startTest(quiz)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:scale-105 active:scale-95 transition-premium shadow-sm"
                  >
                    Start Test <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
