"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Volume2, Sparkles, Headphones, Shield, Cpu } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-premium">
      <Navbar />

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 md:py-40 max-w-5xl mx-auto w-full text-center">
        {/* Eyebrow Tag */}
        <div className="mb-6 rounded-full px-4 py-1.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground w-max mx-auto">
          Intelligent PDF to Audiobook Reader
        </div>

        {/* Hero Headlines */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-sans text-foreground max-w-3xl leading-none">
          Read with Your Ears. <br />
          Listen with Your Eyes.
        </h1>
        
        <p className="mt-6 text-sm md:text-base text-muted-foreground/80 max-w-xl leading-relaxed">
          Readify AI transforms your books, documents, and scanned PDFs into natural, high-fidelity neural audiobooks. Extract chapters, search text, and chat with your pages.
        </p>

        {/* Call to Actions - Button in Button Pattern */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/library" className="group relative rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold pl-6 pr-2 py-2 flex items-center gap-4 transition-premium hover:scale-105 active:scale-95 shadow-lg">
            Open Library
            <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-premium">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link href="/upload" className="px-6 py-3.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground text-xs md:text-sm font-semibold transition-premium active:scale-95">
            Upload PDF Book
          </Link>
        </div>

        {/* Asymmetrical Feature Bento Grid */}
        <div className="mt-24 md:mt-36 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          {/* Feature Card 1 - Double Bezel */}
          <div className="p-1.5 rounded-[2rem] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="p-8 rounded-[calc(2rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col h-full justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-6 text-foreground">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold tracking-tight mb-2">Automated Structuring</h3>
                <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed">
                  Automatically segments raw PDF documents into ordered chapters, detects books metadata, and cleans running headers/footers.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Card 2 - Double Bezel */}
          <div className="p-1.5 rounded-[2rem] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="p-8 rounded-[calc(2rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col h-full justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-6 text-foreground">
                  <Headphones className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold tracking-tight mb-2">Premium Audio Player</h3>
                <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed">
                  Continuous sequential chunk playback with speed scaling, position memory, 10s skip backward, 30s skip forward, and chapter selectors.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Card 3 - Double Bezel */}
          <div className="p-1.5 rounded-[2rem] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="p-8 rounded-[calc(2rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col h-full justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-6 text-foreground">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold tracking-tight mb-2">AI Book Assistant</h3>
                <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed">
                  Ask questions and retrieve answers based strictly on book pages using Retrieval-Augmented Generation (RAG).
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground font-sans bg-muted/10">
        <p>&copy; {new Date().getFullYear()} Readify AI. All rights reserved. Upload responsibly.</p>
      </footer>
    </div>
  );
}
