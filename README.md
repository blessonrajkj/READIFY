<div align="center">

# READIFY

### **Read with Your Eyes.**
### **Listen with Your Ears.**

<br>

**Transform your books into immersive audiobook experiences.**

READIFY is an AI-powered reading platform that converts PDF books and scanned documents into structured, listenable audiobooks — while keeping the original reading experience connected to the audio.

<br>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<br>

<a href="https://blessonrajkj.github.io/READIFY/">
  <img src="https://img.shields.io/badge/LIVE%20DEMO-Explore%20READIFY-white?style=for-the-badge" alt="Live Demo">
</a>

</div>

---

# The Idea

Books are traditionally designed to be read.

But reading isn't always convenient.

You might be:

- commuting
- exercising
- working
- coding
- travelling
- studying
- resting your eyes

**READIFY changes how you experience the books you already own.**

Instead of keeping a book trapped inside a PDF:

```text
                         YOUR BOOK
                            │
                            ▼
                     ┌─────────────┐
                     │    PDF      │
                     └──────┬──────┘
                            │
                            ▼
                    TEXT EXTRACTION
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
                 DIGITAL         SCANNED
                   PDF              PDF
                    │               │
                    │              OCR
                    │               │
                    └───────┬───────┘
                            ▼
                      TEXT CLEANING
                            │
                            ▼
                    CHAPTER DETECTION
                            │
                            ▼
                        CHUNKING
                            │
                            ▼
                       TTS ENGINE
                            │
                            ▼
                      AUDIOBOOK
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
              LISTEN       READ       ASK AI
```

**One book. Multiple ways to experience it.**

---

# A Glimpse Inside READIFY

## The Experience

<p align="center">
  <img src="./screenshots/landing.png" width="95%" alt="READIFY Landing Page">
</p>

<p align="center">
  <strong>A minimal interface designed around the content.</strong>
  <br>
  <sub>Less distraction. More reading. More listening.</sub>
</p>

<br>

## Your Library

<p align="center">
  <img src="./screenshots/library.png" width="95%" alt="READIFY Library">
</p>

<p align="center">
  <strong>Your personal audiobook library.</strong>
  <br>
  <sub>Manage your books, track progress and continue listening from where you stopped.</sub>
</p>

<br>

## From PDF to Audiobook

<p align="center">
  <img src="./screenshots/upload.png" width="95%" alt="READIFY PDF Upload">
</p>

<p align="center">
  <strong>Drop a PDF. Let READIFY do the rest.</strong>
  <br>
  <sub>Upload your book and transform it into a high-fidelity listening experience.</sub>
</p>

---

# Why READIFY?

Most PDF readers stop at:

> **"Here is your document."**

READIFY goes further:

> **"How do you want to experience it?"**

You can:

```text
READ
 │
 ├── Follow the original text
 ├── Navigate chapters
 ├── Track your position
 └── Continue where you stopped

LISTEN
 │
 ├── Natural neural voices
 ├── Control playback speed
 ├── Skip forward / backward
 ├── Adjust audio
 └── Set a sleep timer

UNDERSTAND
 │
 ├── Generate summaries
 ├── Extract key takeaways
 ├── Ask questions
 └── Search your book intelligently
```

---

# What READIFY Can Do

### PDF → Audiobook

Turn a PDF into structured audio.

### Scanned PDF → Text

Use OCR to extract content from scanned documents.

### Text → Natural Speech

Generate audiobook audio using configurable TTS providers.

### Automatic Chapters

Detect chapter and section boundaries.

### Synchronized Reading

Follow the spoken content while reading the original text.

### AI Book Assistant

Ask questions about the book and receive contextual answers.

### Personal Library

Keep all your generated audiobooks in one place.

### Progress Tracking

Continue listening from exactly where you stopped.

---

# The READIFY Pipeline

A book passes through multiple stages before it becomes an audiobook.

```text
                    ┌───────────────┐
                    │   PDF BOOK    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ File Validation│
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Text / OCR     │
                    │ Extraction     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Text Cleaning  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Chapter        │
                    │ Detection      │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Smart Chunking │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ AI Summaries   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ TTS Generation │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   AUDIOBOOK   │
                    └───────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
           LISTEN          READ           ASK
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                      UNDERSTAND MORE
```

---

# Intelligent PDF Processing

## Digital PDFs

For normal text-based PDFs, READIFY extracts the document content directly.

```text
PDF
 ↓
Text Extraction
 ↓
Cleaning
 ↓
Structure Detection
```

## Scanned PDFs

Some PDFs contain images instead of selectable text.

READIFY can detect documents with insufficient extracted text and use OCR.

```text
SCANNED PDF
     │
     ▼
   OCR
     │
     ▼
Extracted Text
     │
     ▼
Cleaned Content
```

This makes READIFY useful for more than perfectly formatted digital books.

---

# Intelligent Text Cleaning

Raw PDF extraction can contain unwanted formatting artifacts.

Examples include:

```text
page numbers
headers
footers
broken lines
hyphenated words
repeated headings
excess whitespace
OCR artifacts
```

READIFY cleans and normalizes extracted text before processing it for speech.

For example:

```text
multi-
processing
```

becomes:

```text
multiprocessing
```

The goal is simple:

> **Make extracted text sound like actual prose.**

---

# Automatic Chapter Detection

READIFY analyzes extracted content for common structural patterns.

Examples:

```text
Chapter 1
Chapter 2

Part I
Part II

Section 1
Section 2

Unit 1
Unit 2
```

When chapter headings cannot be confidently identified, the system can fall back to page-based grouping.

The result:

```text
RAW PDF

Page 001
Page 002
Page 003
...
Page 200

        ↓

READIFY

Chapter 1
Chapter 2
Chapter 3
Chapter 4
...
```

---

# Audiobook Generation

READIFY supports configurable speech providers.

## Edge TTS

The default option for neural speech generation.

Useful for generating natural audiobook-style narration without requiring a paid API key.

## OpenAI TTS

Optional OpenAI-powered speech generation.

## ElevenLabs

Optional ElevenLabs speech generation.

```text
                    READIFY TTS
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          EDGE TTS     OPENAI    ELEVENLABS
              │          │          │
              └──────────┼──────────┘
                         ▼
                    AUDIO OUTPUT
```

The provider can be selected through configuration.

---

# A Real Audiobook Player

READIFY isn't simply:

```text
PDF → MP3
```

It provides a complete listening experience.

## Playback

- Play / Pause
- Previous chapter
- Next chapter
- Seek through chapter
- Skip backward
- Skip forward
- Volume control
- Mute

## Playback Speed

```text
0.5x
0.75x
1.0x
1.25x
1.5x
1.75x
2.0x
```

## Sleep Timer

```text
5 minutes
10 minutes
15 minutes
30 minutes
45 minutes
60 minutes
End of chapter
```

Perfect for listening before sleep or during long sessions.

---

# Synchronized Reading

READIFY connects the audiobook with the original text.

```text
             AUDIO
               │
               ▼
        CURRENT AUDIO CHUNK
               │
               ▼
         TEXT POSITION
               │
               ▼
        READING HIGHLIGHT
```

Instead of choosing between reading and listening:

> **READIFY lets you do both.**

---

# AI-Powered Book Assistant

A book shouldn't just be something you consume.

It can become something you interact with.

Ask questions like:

```text
"What is this chapter about?"

"What are the main ideas?"

"Explain this concept simply."

"What did the author mean by this?"

"What are the key takeaways?"
```

READIFY can retrieve relevant content from the book before generating an answer.

---

# Retrieval-Augmented Book Chat

The AI layer can use a retrieval pipeline instead of blindly answering questions.

```text
                     USER QUESTION
                           │
                           ▼
                   QUERY PROCESSING
                           │
                           ▼
                 SEMANTIC RETRIEVAL
                           │
                           ▼
                  RELEVANT CHUNKS
                           │
                           ▼
                    AI GENERATION
                           │
                           ▼
                 CONTEXTUAL ANSWER
                           │
                           ▼
                    SOURCE CONTEXT
```

The retrieval layer can use embeddings and similarity search.

A local TF-IDF fallback can also be used when semantic AI retrieval is unavailable.

---

# AI Reading Tools

READIFY can turn chapters into useful study material.

### Chapter Summary

Understand a chapter without rereading every page.

### Key Takeaways

Extract the most important ideas.

### Important Concepts

Identify concepts worth remembering.

### Book Questions

Ask the book directly through the AI assistant.

---

# Your Personal Library

The library is more than a list of uploaded PDFs.

It provides a personal audiobook workspace.

```text
┌─────────────────────────────────────┐
│             YOUR LIBRARY             │
├─────────────────────────────────────┤
│                                     │
│  TOTAL BOOKS      PROCESSING        │
│       03              00            │
│                                     │
│  COMPLETED        LISTENING         │
│       03              00            │
│                                     │
└─────────────────────────────────────┘
```

Each book can contain:

- Cover
- Title
- Author
- Chapter information
- Progress
- Listening state
- Continue listening action

---

# Progress That Remembers

You shouldn't have to remember where you stopped.

READIFY can persist listening progress and playback preferences.

```text
BOOK
 │
 ├── Chapter
 │
 ├── Position
 │
 ├── Playback Speed
 │
 └── Continue Listening
```

Come back later.

Press play.

Keep going.

---

# Authentication

READIFY includes authenticated user access.

```text
SIGN UP
   │
   ▼
PASSWORD HASHING
   │
   ▼
JWT AUTHENTICATION
   │
   ▼
PROTECTED USER DATA
```

Passwords are hashed rather than stored directly.

JWT tokens are used to protect authenticated API requests.

---

# Background Processing

Large books can take time to process.

Instead of keeping the main API request busy, READIFY uses background processing.

```text
                    USER
                     │
                     ▼
                   UPLOAD
                     │
                     ▼
                 CREATE JOB
                     │
                     ▼
            ┌──────────────────┐
            │ BACKGROUND WORKER│
            └────────┬─────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
         OCR      CHAPTERS      TTS
          │          │          │
          └──────────┼──────────┘
                     ▼
                  AUDIO
                     │
                     ▼
                COMPLETED
```

This allows the application to remain responsive while books are being processed.

---

# Processing Lifecycle

A typical processing job can move through stages such as:

```text
10%   Text extraction / OCR
40%   OCR completed
45%   Chapter detection
50%   Text processing
95%   Audio generation
100%  Completed
```

The worker architecture is designed to safely handle queued processing jobs.

---

# Architecture

```text
┌─────────────────────────────────────────────────────┐
│                    READIFY CLIENT                   │
│                                                     │
│            Next.js + React + TypeScript             │
│                                                     │
│   Landing │ Library │ Upload │ Reader │ Settings    │
└──────────────────────────┬──────────────────────────┘
                           │
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────┐
│                    FASTAPI API                      │
│                                                     │
│ Authentication │ Books │ Chapters │ Audio           │
│ Progress       │ Search │ Assistant                 │
└───────────────┬──────────────────┬──────────────────┘
                │                  │
                ▼                  ▼
       ┌────────────────┐   ┌────────────────┐
       │   PostgreSQL   │   │ File Storage   │
       │                │   │                │
       │ Users          │   │ PDFs           │
       │ Books          │   │ Covers         │
       │ Chapters       │   │ Audio          │
       │ Jobs           │   │                │
       └────────────────┘   └────────────────┘
                │
                ▼
       ┌─────────────────────┐
       │ Background Worker   │
       │                     │
       │ PDF Processing      │
       │ OCR                 │
       │ Text Cleaning       │
       │ Chapter Detection   │
       │ Chunking            │
       │ TTS                 │
       └──────────┬──────────┘
                  │
          ┌───────┴────────┐
          ▼                ▼
      TTS Layer         AI Layer
          │                │
     ┌────┼────┐      ┌────┴─────┐
     │    │    │      │ Gemini   │
    Edge OpenAI Eleven│ RAG      │
     │    │    │      │ Summary  │
     └────┴────┘      └──────────┘
```

---

# Technology

## Frontend

| Technology | Role |
|---|---|
| Next.js 16 | Application framework |
| React 19 | User interface |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Lucide React | Interface icons |

## Backend

| Technology | Role |
|---|---|
| Python | Backend language |
| FastAPI | REST API |
| SQLAlchemy | ORM |
| PostgreSQL | Database |
| PyMuPDF | PDF processing |
| EasyOCR | OCR |
| Edge-TTS | Speech generation |
| Mutagen | Audio metadata |
| JWT | Authentication |
| bcrypt | Password hashing |

## AI

| Technology | Role |
|---|---|
| Google Gemini | AI assistant |
| Gemini Embeddings | Semantic retrieval |
| TF-IDF | Local retrieval fallback |
| FAISS | Vector search capability |

## Infrastructure

| Technology | Role |
|---|---|
| Docker | Containerization |
| Docker Compose | Service orchestration |
| Redis | Queue / infrastructure |
| PostgreSQL | Application state |

---

# Getting Started

## Prerequisites

Make sure you have:

```text
Node.js 20+
Python 3.11+
PostgreSQL 17+
```

For the Docker setup:

```text
Docker
Docker Compose
```

---

# Backend Setup

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

### Windows

```powershell
.venv\Scripts\activate
```

### macOS / Linux

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
python run.py
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

# Start the Worker

Open another terminal:

```bash
cd backend
```

Activate the environment.

Windows:

```powershell
.venv\Scripts\activate
```

Start the audio worker:

```bash
python -m app.workers.audio_worker
```

The worker will wait for processing jobs.

---

# Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Environment Variables

Create your environment file from the example configuration.

```bash
cp .env.example .env
```

Example:

```env
PROJECT_NAME="Readify AI"

JWT_SECRET="your-long-random-secret"

DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/readify"

DATABASE_URL_MASTER="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres"

REDIS_URL="redis://localhost:6379/0"

STORAGE_PROVIDER="local"

TTS_PROVIDER="edge"

OPENAI_API_KEY=""
ELEVENLABS_API_KEY=""

GEMINI_API_KEY=""
```

### Important

Never commit:

```text
API keys
Database passwords
JWT secrets
Production credentials
Private tokens
```

to GitHub.

---

# Docker

READIFY can also be launched using Docker Compose.

```bash
docker compose up --build
```

The application can run as multiple services:

```text
Frontend
   │
Backend
   │
Worker
   │
PostgreSQL
   │
Redis
```

Typical development endpoints:

```text
Frontend  → http://localhost:3000
Backend   → http://localhost:8000
PostgreSQL → localhost:5432
Redis     → localhost:6379
```

---

# API

The backend is organized around dedicated API domains.

```text
/api/auth
/api/books
/api/chapters
/api/audio
/api/progress
/api/search
/api/assistant
```

Interactive API documentation is available at:

```text
http://localhost:8000/docs
```

when the backend is running.

---

# Testing

Backend tests are included.

Run:

```bash
cd backend
```

Then:

### Windows PowerShell

```powershell
$env:PYTHONPATH="."
pytest tests/
```

### macOS / Linux

```bash
PYTHONPATH=. pytest tests/
```

---

# Design Philosophy

READIFY follows one simple principle:

> **The interface should disappear behind the content.**

The visual language focuses on:

```text
Dark surfaces
       +
Soft contrast
       +
Minimal navigation
       +
Large typography
       +
Subtle borders
       +
Focused controls
```

The goal isn't to make the application look complicated.

The goal is to make reading feel effortless.

---

# What Makes It Different?

READIFY combines several experiences into one platform:

```text
                  ┌─────────────┐
                  │     BOOK    │
                  └──────┬──────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
          READER       AUDIO           AI
            │            │             │
            ▼            ▼             ▼
          READ         LISTEN         ASK
            │            │             │
            └────────────┼─────────────┘
                         ▼
                  UNDERSTAND MORE
```

It's not just a:

**PDF reader**

and not just an:

**audiobook generator.**

It's a bridge between the two.

---

# Roadmap

## Reading

- [ ] Improved text highlighting
- [ ] Better chapter navigation
- [ ] Advanced bookmarks
- [ ] Reading statistics
- [ ] Better search

## Audio

- [ ] More TTS providers
- [ ] Voice previews
- [ ] Per-chapter voice selection
- [ ] Advanced equalizer
- [ ] Better audio normalization

## AI

- [ ] Cross-chapter questions
- [ ] Better semantic search
- [ ] Personalized summaries
- [ ] AI-generated study notes
- [ ] Stronger source grounding

## Platform

- [ ] Cloud storage
- [ ] Multi-device synchronization
- [ ] Mobile application
- [ ] Offline audiobook downloads
- [ ] Public / private libraries

---

# Privacy

READIFY can process important parts of the workflow locally.

```text
PDF Extraction     → Local
OCR                → Local
Text Cleaning      → Local
Database           → PostgreSQL
Audio              → Configurable
AI                 → Optional
```

When external AI or TTS providers are enabled, relevant content may be sent to those providers according to their APIs and privacy policies.

---

# Project Status

```text
PDF Processing          ████████████████████
OCR                     ████████████████████
Text Cleaning           ████████████████████
Chapter Detection       ████████████████████
TTS                     ████████████████████
Audiobook Player        ████████████████████
Library                 ████████████████████
Progress Tracking       ████████████████████
AI Assistant            ████████████████████
Docker                  ████████████████████
```

READIFY is an actively evolving project.

---

# Contributing

Contributions, ideas and improvements are welcome.

Fork the repository:

```bash
git clone <your-fork-url>
```

Create a feature branch:

```bash
git checkout -b feature/your-feature
```

Make your changes:

```bash
git add .
git commit -m "Add your feature"
```

Push the branch:

```bash
git push origin feature/your-feature
```

Then open a Pull Request.

---

# License

This project is licensed under the **MIT License**.

---

<div align="center">

# READIFY

### **Read with Your Eyes.**
### **Listen with Your Ears.**

<br>

```text
BOOK
  ↓
TEXT
  ↓
VOICE
  ↓
UNDERSTANDING
```

<br>

Built with **Next.js · React · TypeScript · Python · FastAPI · PostgreSQL · AI**

<br>

### Created by Blesson Raj K J

<br>

<a href="https://github.com/blessonrajkj">
  <img src="https://img.shields.io/badge/GitHub-Blesson%20Raj%20K%20J-black?style=for-the-badge&logo=github" alt="GitHub">
</a>

<br><br>

**If READIFY changes the way you experience books, consider giving the repository a ⭐**

</div>
