"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, File, CheckCircle2, AlertCircle, Loader2, ArrowRight, X } from "lucide-react";
import Navbar from "@/components/Navbar";

interface JobStatus {
  id: string;
  book_id: string;
  status: string;
  progress: number;
  error_message: string | null;
}

export default function UploadPage() {
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Job and Book info
  const [bookId, setBookId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // Polling for processing status
  useEffect(() => {
    if (uploadStatus !== "processing" || !bookId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/books/${bookId}/progress`);
        if (res.ok) {
          const job: JobStatus = await res.json();
          setJobStatus(job);
          
          if (job.status === "completed") {
            setUploadStatus("completed");
            clearInterval(interval);
          } else if (job.status === "failed") {
            setUploadStatus("failed");
            setErrorMessage(job.error_message || "An error occurred during audio generation.");
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Error polling job progress", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [uploadStatus, bookId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      setErrorMessage("Only PDF files are supported.");
      return;
    }
    
    // Sane limit of 100MB
    if (selectedFile.size > 100 * 1024 * 1024) {
      setErrorMessage("File exceeds the maximum size of 100MB.");
      return;
    }
    
    setFile(selectedFile);
    setErrorMessage("");
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  const handleUploadSubmit = () => {
    if (!file) return;

    setUploadStatus("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8000/api/books/upload", true);

    // Track upload progress
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        // Map 0-100% upload to 0-99% progress bar for upload stage
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 201) {
        const response = JSON.parse(xhr.responseText);
        setBookId(response.id);
        setUploadStatus("processing");
        setUploadProgress(0);
      } else {
        const response = JSON.parse(xhr.responseText);
        setUploadStatus("failed");
        setErrorMessage(response.detail || "Failed to upload file.");
      }
    };

    xhr.onerror = () => {
      setUploadStatus("failed");
      setErrorMessage("Network failure occurred during upload.");
    };

    xhr.send(formData);
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setBookId(null);
    setJobStatus(null);
  };

  // Convert bytes to human readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Map progress to descriptive status label
  const getProcessingMessage = (progressVal: number) => {
    if (progressVal < 10) return "Uploading & analyzing PDF structure...";
    if (progressVal < 40) return "Extracting text page-by-page (checking OCR)...";
    if (progressVal < 50) return "Detecting chapter divisions and cleaning headers...";
    if (progressVal < 95) return `Generating neural speech tracks (synthesizing audio)...`;
    return "Optimizing track playback databases...";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-premium font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-28 flex flex-col justify-center">
        <div className="mb-10 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Upload Audiobook</h1>
          <p className="text-xs md:text-sm text-muted-foreground/80 mt-1">Convert any PDF book into a high-fidelity audiobook player.</p>
        </div>

        {/* Double Bezel Outer Enclosure */}
        <div className="p-1.5 rounded-[2rem] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 shadow-lg">
          {/* Inner Core */}
          <div className="p-6 md:p-8 rounded-[calc(2rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-6">
            
            {/* Drag & Drop Zone */}
            {uploadStatus === "idle" && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-premium ${
                  isDragOver 
                    ? "border-primary bg-primary/[0.03] scale-[1.01]" 
                    : "border-border hover:border-muted-foreground/40 hover:bg-muted/10"
                }`}
              >
                <input
                  type="file"
                  id="pdf-file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold">Drag & drop your PDF here</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Maximum file size: 100MB</p>
                </div>
                <button className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-xs font-semibold transition-premium">
                  Browse Files
                </button>
              </div>
            )}

            {/* Selected File Details */}
            {file && uploadStatus === "idle" && (
              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center"><File className="w-4 h-4" /></div>
                  <div className="truncate">
                    <p className="text-xs font-semibold truncate max-w-xs">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button onClick={removeFile} className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Upload Button */}
            {file && uploadStatus === "idle" && (
              <button
                onClick={handleUploadSubmit}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:scale-105 active:scale-95 transition-premium shadow-md flex items-center justify-center gap-2"
              >
                Convert to Audiobook
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* ERROR DISPLAY */}
            {errorMessage && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-xs text-red-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Upload failed</p>
                  <p className="opacity-90">{errorMessage}</p>
                  <button onClick={removeFile} className="underline font-semibold mt-2 block">Try another file</button>
                </div>
              </div>
            )}

            {/* UPLOADING STATE */}
            {uploadStatus === "uploading" && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading PDF...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-premium" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            {/* PROCESSING STATE */}
            {uploadStatus === "processing" && (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing book...</span>
                  <span className="font-mono text-muted-foreground">{(jobStatus?.progress || 0)}%</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-premium" 
                    style={{ width: `${jobStatus?.progress || 0}%` }}
                  ></div>
                </div>
                
                {/* Sub status message */}
                <p className="text-xs text-muted-foreground text-center font-sans tracking-wide">
                  {getProcessingMessage(jobStatus?.progress || 0)}
                </p>

                {/* Status Steps checklist */}
                <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <div className={`flex items-center gap-2 ${(jobStatus?.progress || 0) >= 10 ? "text-primary font-medium" : ""}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${ (jobStatus?.progress || 0) >= 10 ? "bg-primary" : "bg-muted" }`}></div>
                    <span>Extracting book text {(jobStatus?.progress || 0) >= 40 && "✓"}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${(jobStatus?.progress || 0) >= 40 ? "text-primary font-medium" : ""}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${ (jobStatus?.progress || 0) >= 40 ? "bg-primary" : "bg-muted" }`}></div>
                    <span>Detecting chapters {(jobStatus?.progress || 0) >= 50 && "✓"}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${(jobStatus?.progress || 0) >= 50 ? "text-primary font-medium" : ""}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${ (jobStatus?.progress || 0) >= 50 ? "bg-primary" : "bg-muted" }`}></div>
                    <span>Synthesizing voice tracks {(jobStatus?.progress || 0) >= 95 && "✓"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* COMPLETED STATE */}
            {uploadStatus === "completed" && (
              <div className="text-center py-6 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Audiobook Ready</h3>
                  <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs leading-relaxed">
                    We successfully read the PDF, segmented it into chapters, and generated natural speech tracks.
                  </p>
                </div>
                
                <button
                  onClick={() => router.push(`/book/${bookId}/read`)}
                  className="mt-4 w-full py-3 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:scale-105 active:scale-95 transition-premium shadow-md flex items-center justify-center gap-2"
                >
                  Start Listening
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
