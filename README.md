# Readify AI — Intelligent PDF to Audiobook Reader

Readify AI is a production-quality web application that converts uploaded PDF books and documents into high-fidelity neural audiobooks. It segments books into structured chapters, cleans header/footer artifacts, runs offline OCR for scanned images, and allows users to listen through a premium audiobook player with real-time text-audio synchronization and an AI-powered conversational reading assistant.

---

## Key Features

1. **Intelligent Text Extraction**: Integrates PyMuPDF (`fitz`) to extract page-by-page content and metadata. Uses **EasyOCR** locally to transcribe scanned or image-based pages.
2. **Text Cleaning**: Join split line hyphens, filter headers, footers, repeated book titles, and page numbers, while preserving syntax and speech punctuation.
3. **Automated Chaptering**: Heuristic-based regex scanning automatically segments documents into chapters. If none are found, sections are created page-by-page.
4. **Interactive Chapter Modifiers**: Users can Rename, Delete, Merge, and Split chapters directly from the dashboard.
5. **Multi-Provider TTS Synthesis**: Supports ElevenLabs, OpenAI Audio TTS, and Microsoft Edge neural speech. Defaults to **Edge TTS** to provide natural-sounding voices for English, Tamil, and Hindi for free without API keys.
6. **Concurrent Background Workers**: Uses a PostgreSQL database-backed task queue (`FOR UPDATE SKIP LOCKED`) to run transcribing, cleaning, and synthesis pipelines asynchronously.
7. **Premium Audiobook Player**: Includes play/pause toggles, skip back 10s, skip forward 30s, volume adjust, rate scale (0.5x to 2.0x), and position memory.
8. **Synced Reading Mode**: Highlight spoken text segments in real-time, and click paragraphs to jump directly to that track timestamp.
9. **AI Book Assistant (RAG)**: Chat with book pages and extract summaries or key takeaways using local FAISS matching and Google Gemini.

---

## Tech Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, Mutagen, PyMuPDF, EasyOCR, Edge-TTS.
- **Queueing**: Database-backed job row lock engine (Local) / Redis + Celery (Docker/Production).

---

## Local Setup (Windows)

### Prerequisites
- Node.js (v20+ recommended)
- Python (v3.11+ recommended)
- PostgreSQL 17 (Ensure service is running locally on port `5432`)

### 1. Database Configuration
PostgreSQL should be running. The default local config in `.env` uses:
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `kjbb2320`

*Note: The application will automatically check for and create the `readify` target database on startup.*

### 2. Backend Setup
1. Open a terminal inside the project root and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database tests to verify:
   ```bash
   $env:PYTHONPATH="."
   pytest tests/
   ```
5. Run the FastAPI server:
   ```bash
   python run.py
   ```
   *The server starts on `http://localhost:8000`. API docs are available at `http://localhost:8000/docs`.*

### 3. Background Worker Setup
To process PDFs and generate TTS audio, run the worker loop alongside the backend server:
1. Open a new terminal and navigate to the backend:
   ```bash
   cd backend
   .venv\Scripts\activate
   ```
2. Run the worker process:
   ```bash
   python -m app.workers.audio_worker
   ```

### 4. Frontend Setup
1. Open a terminal and navigate to the frontend:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:3000` to view the application.*

---

## Running with Docker Compose

To deploy the entire multi-container stack (including Redis, PostgreSQL, and worker instances):
1. Execute from the root directory:
   ```bash
   docker-compose up --build
   ```
2. Access:
   - **Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:8000`

---

## Configuration (`.env`)

Create a `.env` file in the root directory. Key options:
```env
PROJECT_NAME="Readify AI"
JWT_SECRET="generate_a_long_random_hex_string_for_production"

# Database Configuration
DATABASE_URL="postgresql://postgres:kjbb2320@localhost:5432/readify"
DATABASE_URL_MASTER="postgresql://postgres:kjbb2320@localhost:5432/postgres"

# TTS Configuration (edge / openai / elevenlabs)
TTS_PROVIDER="edge"
OPENAI_API_KEY=""
ELEVENLABS_API_KEY=""

# Gemini API Key (Enables AI book chatbot & summaries)
GEMINI_API_KEY="your_api_key_here"
```
