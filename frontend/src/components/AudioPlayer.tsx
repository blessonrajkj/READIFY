"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, SkipForward, SkipBack, RotateCcw, RotateCw, 
  Volume2, VolumeX, Settings, ChevronUp, FastForward 
} from "lucide-react";

interface AudioChunk {
  chunk_id: string;
  text: string;
  chunk_index: number;
  page_number: number | null;
  audio_url: string | null;
  status: string;
  duration: number;
}

interface AudioPlayerProps {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  chunks: AudioChunk[];
  initialPosition?: number; // overall position in seconds
  onProgressUpdate?: (positionSeconds: number, speed: number) => void;
  onChunkActive?: (chunkIndex: number, text: string) => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export default function AudioPlayer({
  bookId,
  chapterId,
  chapterTitle,
  chunks,
  initialPosition = 0,
  onProgressUpdate,
  onChunkActive,
  onNextChapter,
  onPrevChapter
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  // Chapter-wide time tracking
  const [chapterTime, setChapterTime] = useState(0);
  const [chapterDuration, setChapterDuration] = useState(0);
  
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  // 1. Calculate overall chapter duration when chunks change
  useEffect(() => {
    const total = chunks.reduce((sum, chunk) => sum + (chunk.duration || 0), 0);
    setChapterDuration(total || 1.0); // avoid divide by zero
  }, [chunks]);

  // 2. Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // 3. Handle chunk loading and initial position seek
  useEffect(() => {
    if (!audioRef.current || chunks.length === 0) return;
    
    // Check if initialPosition was set (and chunks have durations loaded)
    let targetChunkIdx = 0;
    let targetChunkOffset = 0;
    
    if (initialPosition > 0) {
      let accumulatedTime = 0;
      for (let i = 0; i < chunks.length; i++) {
        const d = chunks[i].duration || 0;
        if (accumulatedTime + d >= initialPosition) {
          targetChunkIdx = i;
          targetChunkOffset = initialPosition - accumulatedTime;
          break;
        }
        accumulatedTime += d;
      }
    }
    
    setActiveChunkIndex(targetChunkIdx);
    
    // Set source for target chunk
    const targetChunk = chunks[targetChunkIdx];
    if (targetChunk && targetChunk.audio_url) {
      audioRef.current.src = `http://localhost:8000${targetChunk.audio_url}`;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.currentTime = targetChunkOffset;
      
      if (isPlaying) {
        setIsLoading(true);
        audioRef.current.play()
          .then(() => setIsLoading(false))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [chunks, chapterId]); // trigger on chapter or chunk changes

  // 4. Update playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // 5. Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 6. Listen to audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      // Calculate overall chapter time
      let accumulatedTime = 0;
      for (let i = 0; i < activeChunkIndex; i++) {
        accumulatedTime += chunks[i]?.duration || 0;
      }
      const overallTime = accumulatedTime + audio.currentTime;
      setChapterTime(overallTime);

      // Periodically trigger progress callback (e.g. every 3 seconds)
      if (onProgressUpdate && Math.round(overallTime) % 3 === 0) {
        onProgressUpdate(overallTime, playbackSpeed);
      }
    };

    const handleEnded = () => {
      // Move to next chunk if available
      if (activeChunkIndex < chunks.length - 1) {
        const nextIdx = activeChunkIndex + 1;
        setActiveChunkIndex(nextIdx);
        
        const nextChunk = chunks[nextIdx];
        if (nextChunk && nextChunk.audio_url) {
          audio.src = `http://localhost:8000${nextChunk.audio_url}`;
          audio.playbackRate = playbackSpeed;
          audio.volume = isMuted ? 0 : volume;
          audio.currentTime = 0;
          setIsLoading(true);
          audio.play()
            .then(() => setIsLoading(false))
            .catch(() => setIsPlaying(false));
            
          if (onChunkActive) {
            onChunkActive(nextIdx, nextChunk.text);
          }
        }
      } else {
        // End of chapter!
        setIsPlaying(false);
        if (onNextChapter) {
          onNextChapter();
        }
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
    };
  }, [activeChunkIndex, chunks, isPlaying, volume, isMuted, playbackSpeed]);

  // Notify parent of active chunk text on mount or chunk change
  useEffect(() => {
    if (chunks.length > 0 && onChunkActive) {
      onChunkActive(activeChunkIndex, chunks[activeChunkIndex]?.text || "");
    }
  }, [activeChunkIndex, chunks]);

  // Controls
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || chunks.length === 0) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      // Save progress on pause
      if (onProgressUpdate) onProgressUpdate(chapterTime, playbackSpeed);
    } else {
      // Ensure source is loaded
      if (!audio.src && chunks[activeChunkIndex]?.audio_url) {
        audio.src = `http://localhost:8000${chunks[activeChunkIndex].audio_url}`;
      }
      setIsLoading(true);
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Audio playback error:", err);
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  };

  const skipForward = () => {
    seekTo(chapterTime + 30);
  };

  const skipBackward = () => {
    seekTo(chapterTime - 10);
  };

  const seekTo = (targetTime: number) => {
    if (!audioRef.current || chunks.length === 0) return;

    // Clamp targetTime
    const time = Math.max(0, Math.min(targetTime, chapterDuration));
    
    // Find target chunk index
    let accumulatedTime = 0;
    let targetIdx = 0;
    let offset = 0;

    for (let i = 0; i < chunks.length; i++) {
      const d = chunks[i].duration || 0;
      if (accumulatedTime + d >= time) {
        targetIdx = i;
        offset = time - accumulatedTime;
        break;
      }
      accumulatedTime += d;
      
      // If we reach the end and didn't trigger, it's the last chunk
      if (i === chunks.length - 1) {
        targetIdx = i;
        offset = Math.max(0, d - 0.1); // slightly before the absolute end
      }
    }

    if (targetIdx === activeChunkIndex) {
      // Same chunk, just adjust local audio time
      audioRef.current.currentTime = offset;
      setChapterTime(time);
    } else {
      // Different chunk, reload source
      setActiveChunkIndex(targetIdx);
      const targetChunk = chunks[targetIdx];
      if (targetChunk && targetChunk.audio_url) {
        audioRef.current.src = `http://localhost:8000${targetChunk.audio_url}`;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.currentTime = offset;
        setChapterTime(time);
        
        if (isPlaying) {
          setIsLoading(true);
          audioRef.current.play()
            .then(() => setIsLoading(false))
            .catch(() => setIsPlaying(false));
        }
      }
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  // Helper formatting mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const timeRemaining = Math.max(0, chapterDuration - chapterTime);

  return (
    <div className="w-full bg-card border-t border-border p-4 md:p-6 shadow-2xl transition-premium">
      <div className="mx-auto max-w-5xl flex flex-col gap-4">
        {/* Top Info & Sliders */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground font-medium">Listening to</span>
            <h4 className="text-sm font-semibold truncate max-w-xs md:max-w-md">{chapterTitle}</h4>
          </div>
          
          {/* Progress Time Stamps */}
          <div className="flex items-center justify-between md:justify-end gap-4 text-xs font-mono text-muted-foreground">
            <span>{formatTime(chapterTime)}</span>
            <span>-{formatTime(timeRemaining)}</span>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="relative w-full">
          <input
            type="range"
            min={0}
            max={chapterDuration}
            value={chapterTime}
            onChange={handleProgressBarChange}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                (chapterTime / chapterDuration) * 100
              }%, hsl(var(--muted)) ${(chapterTime / chapterDuration) * 100}%, hsl(var(--muted)) 100%)`
            }}
          />
        </div>

        {/* Player Controls Bar */}
        <div className="flex items-center justify-between gap-4 mt-2">
          {/* Left Controls: Speed Selector */}
          <div className="relative flex items-center w-1/4">
            <button
              onClick={() => setIsSpeedOpen(!isSpeedOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-premium active:scale-95"
            >
              <FastForward className="w-3.5 h-3.5" />
              {playbackSpeed}x
            </button>

            {isSpeedOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSpeedOpen(false)}></div>
                <div className="absolute bottom-10 left-0 bg-popover border border-border p-1.5 rounded-2xl shadow-xl z-20 w-24">
                  {speedOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setPlaybackSpeed(s);
                        setIsSpeedOpen(false);
                      }}
                      className={`flex w-full items-center justify-center px-3 py-1.5 rounded-xl text-xs transition-premium ${
                        playbackSpeed === s ? "bg-muted font-semibold" : "hover:bg-muted/50"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevChapter}
              disabled={!onPrevChapter}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-premium active:scale-90"
              title="Previous Chapter"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={skipBackward}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-premium active:scale-90"
              title="Skip backward 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Play Button - Double Bezel */}
            <div className="p-1 rounded-full bg-primary/5 ring-1 ring-primary/10">
              <button
                onClick={togglePlay}
                disabled={chunks.length === 0}
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-premium disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                )}
              </button>
            </div>

            <button
              onClick={skipForward}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-premium active:scale-90"
              title="Skip forward 30s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={onNextChapter}
              disabled={!onNextChapter}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-premium active:scale-90"
              title="Next Chapter"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Right Controls: Volume */}
          <div className="flex items-center justify-end gap-2 w-1/4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-premium active:scale-95"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
