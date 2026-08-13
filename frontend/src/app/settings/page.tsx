"use client";

import React, { useState, useEffect } from "react";
import { Save, Settings, Shield, Volume2, Sparkles, AlertCircle, Check } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
  const [ttsProvider, setTtsProvider] = useState("edge");
  const [language, setLanguage] = useState("en");
  const [openaiKey, setOpenaiKey] = useState("");
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load from local storage
    setTtsProvider(localStorage.getItem("readify-tts-provider") || "edge");
    setLanguage(localStorage.getItem("readify-language") || "en");
    setOpenaiKey(localStorage.getItem("readify-openai-key") || "");
    setElevenlabsKey(localStorage.getItem("readify-elevenlabs-key") || "");
    setGeminiKey(localStorage.getItem("readify-gemini-key") || "");
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaved(false);

    try {
      localStorage.setItem("readify-tts-provider", ttsProvider);
      localStorage.setItem("readify-language", language);
      localStorage.setItem("readify-openai-key", openaiKey);
      localStorage.setItem("readify-elevenlabs-key", elevenlabsKey);
      localStorage.setItem("readify-gemini-key", geminiKey);
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError("Failed to save settings to localStorage.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-premium font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-28 flex flex-col justify-center">
        <div className="mb-10 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Application Settings
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground/80 mt-1">Configure voices, TTS engine parameters, and API keys.</p>
        </div>

        {/* Double Bezel Enclosure */}
        <div className="p-1.5 rounded-[2rem] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 shadow-lg">
          <form onSubmit={handleSave} className="p-6 md:p-8 rounded-[calc(2rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-6">
            
            {/* TTS Engine Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Default TTS Provider</label>
              <select
                value={ttsProvider}
                onChange={(e) => setTtsProvider(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs md:text-sm focus:outline-none"
              >
                <option value="edge">Microsoft Edge TTS (Free Neural, Recommended)</option>
                <option value="openai">OpenAI Audio Speech API</option>
                <option value="elevenlabs">ElevenLabs Speech Synthesis</option>
              </select>
              <p className="text-[10px] text-muted-foreground">
                Edge TTS provides natural neural voices for English, Tamil, and Hindi without API keys.
              </p>
            </div>

            {/* Language Preference */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Default Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs md:text-sm focus:outline-none"
              >
                <option value="en">English (US/UK)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </div>

            {/* API Keys Header */}
            <div className="border-t border-border pt-4 mt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
                <Shield className="w-3.5 h-3.5" /> Security & API Keys
              </h3>
              
              <div className="space-y-4">
                {/* Gemini Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" /> Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AI assistant & RAG summaries key"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* OpenAI Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-primary" /> OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="Required if OpenAI TTS is selected"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* ElevenLabs Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-primary" /> ElevenLabs API Key
                  </label>
                  <input
                    type="password"
                    value={elevenlabsKey}
                    onChange={(e) => setElevenlabsKey(e.target.value)}
                    placeholder="Required if ElevenLabs TTS is selected"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:scale-105 active:scale-95 transition-premium shadow-md flex items-center justify-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Preferences Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}
