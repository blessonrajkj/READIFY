"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Volume2, Sparkles, Headphones, Shield, Cpu, Languages, Eye } from "lucide-react";
import { motion, Variants } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  // Bento Grid animations triggered when scrolled into view
  const bentoContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3
      }
    }
  };

  const bentoCardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 50, damping: 16 } 
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground transition-premium relative overflow-hidden font-sans">
      {/* Cinematic Ambient Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] left-[5%] w-[40rem] h-[40rem] rounded-full bg-primary/5 dark:bg-white/5 blur-[140px] mix-blend-screen animate-ambient-drift" />
        <div className="absolute top-[30%] -right-[10%] w-[35rem] h-[35rem] rounded-full bg-muted/20 dark:bg-white/5 blur-[120px] mix-blend-screen animate-ambient-drift" style={{ animationDelay: '-12s' }} />
      </div>

      <Navbar />

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-28 md:py-44 max-w-5xl mx-auto w-full text-center z-10">

        {/* Hero Headlines with spring motion frame */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.1 }}
          className="text-4xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-3xl leading-[1.05]"
        >
          Read with Your Ears. <br />
          <span className="text-muted-foreground/60 dark:text-muted-foreground/40">Listen with Your Eyes.</span>
        </motion.h1>
        
        {/* Subtitle description motion frame */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.25 }}
          className="mt-8 text-xs md:text-sm text-muted-foreground/80 max-w-xl leading-relaxed"
        >
          Readify transforms books, technical manuals, and scanned PDFs into natural, high-fidelity neural audiobooks. Extract chapters, highlight text as it's spoken, and converse with your pages.
        </motion.p>

        {/* Call to Actions - Scale-in spring motion frame */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.4 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link 
            href="/library" 
            className="group relative rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-bold pl-6 pr-2.5 py-2.5 flex items-center gap-4 transition-premium hover:scale-105 active:scale-95 shadow-xl"
          >
            Open Library
            <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-premium">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link 
            href="/upload" 
            className="px-6 py-4 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground text-xs md:text-sm font-semibold transition-premium active:scale-95 border border-border/40"
          >
            Upload PDF Book
          </Link>
        </motion.div>

        {/* Asymmetrical Bento Grid with staggered scroll reveal */}
        <motion.div 
          variants={bentoContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-32 md:mt-48 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
        >
          
          {/* Card 1: Automated Chaptering (Col-Span 2) */}
          <motion.div 
            variants={bentoCardVariants}
            className="double-bezel-outer card-hover-glow md:col-span-2"
          >
            <div className="p-8 double-bezel-inner flex flex-col md:flex-row gap-6 h-full justify-between items-start md:items-center">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-6 text-foreground">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Automated Structuring</h3>
                <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed max-w-md">
                  Reads and maps the semantic boundaries of documents. Automatically segments pages into ordered chapters, cleans line-split hyphens, and filters running page headers and numbers.
                </p>
              </div>
              <div className="w-full md:w-44 h-28 rounded-2xl bg-muted/40 border border-border/60 p-4 flex flex-col justify-between font-mono text-[9px] text-muted-foreground/80">
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span>File Parsed</span>
                  <span className="text-emerald-500">100%</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span>Cleaned Headers</span>
                  <span>412 rows</span>
                </div>
                <div className="flex justify-between">
                  <span>Detected Chapters</span>
                  <span className="font-bold">14 tracks</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Synced Reader (Col-Span 1) */}
          <motion.div 
            variants={bentoCardVariants}
            className="double-bezel-outer card-hover-glow"
          >
            <div className="p-8 double-bezel-inner flex flex-col h-full justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-6 text-foreground">
                  <Headphones className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Synced Reader</h3>
                <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed">
                  Highlights spoken text segments in real-time. Click any paragraph or sentence in the text interface to immediately seek the audiobook playback to that timestamp.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 3: AI Book Assistant (Col-Span 1) */}
          <motion.div 
            variants={bentoCardVariants}
            className="double-bezel-outer card-hover-glow"
          >
            <div className="p-8 double-bezel-inner flex flex-col h-full justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-6 text-foreground">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Conversational AI</h3>
                <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed">
                  Chat with your book. Extract core takeaways, generate outline summaries, and run vector-search (RAG) queries across pages to locate specific citations.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 4: OCR & Multilingual Speech (Col-Span 2) */}
          <motion.div 
            variants={bentoCardVariants}
            className="double-bezel-outer card-hover-glow md:col-span-2"
          >
            <div className="p-8 double-bezel-inner flex flex-col md:flex-row gap-6 h-full justify-between items-start md:items-center">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-6 text-foreground">
                  <Languages className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2">OCR & Multi-Language</h3>
                <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed max-w-md">
                  Detects and converts image-only scanned books using offline **EasyOCR**. Supports automatic language detection and assigns neural voices for English, Hindi, and Tamil out-of-the-box.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full border border-border bg-muted/30 text-[10px] font-bold">English (US)</span>
                <span className="px-3 py-1 rounded-full border border-border bg-muted/30 text-[10px] font-bold">Tamil (தமிழ்)</span>
                <span className="px-3 py-1 rounded-full border border-border bg-muted/30 text-[10px] font-bold">Hindi (हिन्दी)</span>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </main>

      <footer className="border-t border-border/40 py-12 text-center text-xs text-muted-foreground/60 font-sans bg-muted/[0.02] z-10">
        <p>&copy; {new Date().getFullYear()} Readify. Engineered for deep reading. Upload responsibly.</p>
      </footer>
    </div>
  );
}
