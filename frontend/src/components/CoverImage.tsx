"use client";

import React from "react";
import { BookOpen } from "lucide-react";

interface CoverImageProps {
  title: string;
  author?: string;
  coverPath?: string;
  className?: string;
  aspectRatio?: "portrait" | "square";
}

export default function CoverImage({
  title,
  author = "Unknown Author",
  coverPath,
  className = "",
  aspectRatio = "portrait"
}: CoverImageProps) {
  // Check if we have a valid cover image path
  const hasCover = coverPath && coverPath.trim() !== "";
  
  // Base URLs for the backend assets
  const backendUrl = "http://localhost:8000";
  const fullCoverUrl = hasCover 
    ? (coverPath.startsWith("http") ? coverPath : `${backendUrl}/covers/${os_path_basename(coverPath)}`)
    : null;

  const aspectClass = aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square";

  return (
    <div className={`relative select-none overflow-hidden rounded-2xl border border-border shadow-md bg-muted ${aspectClass} ${className}`}>
      {hasCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fullCoverUrl || ""}
          alt={`Cover of ${title}`}
          className="w-full h-full object-cover transition-premium hover:scale-105"
          onError={(e) => {
            // Fallback on load error
            e.currentTarget.style.display = "none";
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const fallback = parent.querySelector(".fallback-cover");
              if (fallback) fallback.classList.remove("hidden");
            }
          }}
        />
      ) : null}

      {/* Stylized Typographic Cover Fallback */}
      <div 
        className={`fallback-cover absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-br from-neutral-800 to-neutral-950 text-white ${
          hasCover ? "hidden" : ""
        }`}
      >
        <div className="flex justify-between items-start">
          <BookOpen className="w-5 h-5 opacity-40" />
          <span className="text-[10px] tracking-widest uppercase opacity-40 font-medium">Readify AI</span>
        </div>
        
        <div className="flex flex-col gap-2 my-auto">
          <h3 className="font-serif font-semibold text-lg leading-tight tracking-tight line-clamp-3">
            {title}
          </h3>
          <p className="text-xs opacity-60 font-sans tracking-wide truncate">
            {author}
          </p>
        </div>

        <div className="h-1 w-8 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
}

// Simple helper to get the filename from an absolute path (handles Windows/Linux backslashes/slashes)
function os_path_basename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1];
}
