# curiousBuddy — 48-Hour Hackathon Master Plan (`plan.md`)

## 1. Executive Summary & Vision
**curiousBuddy** is an active-learning Pomodoro study companion that replaces passive re-reading with the **Feynman Technique**. When a study session ends, a curious Socratic AI debriefs you on what you just learned, automatically turns your explanation into a structured study journal entry, tracks your daily focus hours in `localStorage`, and lets you generate instant quizzes to test your retention.

### Core Value Proposition
- **Pomodoro Focus:** 25-minute work block + 5-minute break counter.
- **Feynman Debrief Chat:** An AI buddy that asks probing, skeptical follow-up questions instead of blindly praising you.
- **Voice-First Input:** Uses the browser's native Web Speech API so you can lean back and talk out loud to explain your study topic.
- **Auto-Journaling & Quiz Generation:** Summarizes your chat transcript into clean Markdown study notes and generates instant flashcard quizzes.
- **Gamified LocalStorage Stats:** Tracks study minutes, sessions, and daily streaks without requiring a heavy database.

---

## 2. Target Directory Structure

```text
curious-buddy/
├── plan.md
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI backend for Ollama API proxy & journal extraction
│   │   └── schemas.py          # Pydantic models for chat requests & journal generation
│   └── requirements.txt
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── App.tsx             # Main shell with tab navigation (Timer | Debrief | Journal | Stats)
        ├── types.ts            # TypeScript interfaces for sessions, journal entries, and stats
        ├── index.css           # Tailwind CSS imports
        ├── components/
        │   ├── PomodoroTimer.tsx   # Focus timer with play/pause/reset and audio chime
        │   ├── AiDebriefChat.tsx   # Feynman chat interface with voice input & Socratic persona
        │   ├── JournalView.tsx     # Markdown viewer for past study notes + "Quiz Me" modal
        │   └── StatsDashboard.tsx  # LocalStorage streak counter & focus time charts
        └── hooks/
            └── useLocalStorage.ts  # Custom hook for persistent stats and journal entries
```

---

## 3. Data Schemas & Models

### 3.1 TypeScript Interfaces (`frontend/src/types.ts`)
```typescript
export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  topic: string;
  summaryMarkdown: string;
  durationMinutes: number;
  chatTranscript: ChatMessage[];
  quizQuestions: string[];
}

export interface UserStats {
  totalMinutesStudied: number;
  currentStreakDays: number;
  lastActiveDate: string;
  sessionsCompleted: number;
}
```

### 3.2 Pydantic Schemas (`backend/schemas.py`)
```python
from pydantic import BaseModel, Field
from typing import List

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    topic: str = ""

class DebriefRequest(BaseModel):
    transcript: List[ChatMessage]
    topic: str
    duration_minutes: int

class JournalGenerationResponse(BaseModel):
    topic: str
    summary_markdown: str = Field(
        description="Clean, structured Markdown notes explaining the concept clearly using the Feynman technique."
    )
    quiz_questions: List[str] = Field(
        description="3 rapid-fire test questions based on the session explanation."
    )
```

---

## 4. Step-by-Step Implementation Checklist

### Phase 1: Environment Setup & Pomodoro Timer (Hours 1–3)
- [ ] **1.1 Backend Setup:**
  - Create virtual environment and install dependencies:
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install fastapi uvicorn ollama pydantic python-dotenv elevenlabs
    ```
- [ ] **1.2 Frontend Setup:**
  - Create Vite React TypeScript application:
    ```bash
    npm create vite@latest frontend -- --template react-ts
    cd frontend
    npm install
    npm install lucide-react tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```
- [ ] **1.3 Build `PomodoroTimer.tsx`:**
  - Implement 25:00 focus timer and 05:00 break timer logic.
  - Add states: `IDLE`, `WORKING`, `BREAK`, `PAUSED`.
  - When timer reaches 00:00, play an audio chime and automatically transition the user to the **Curious AI Debrief** tab.

---

### Phase 2: Socratic AI Debrief & Voice Input (Hours 4–8)
- [ ] **2.1 Build `AiDebriefChat.tsx`:**
  - Create message bubble interface.
  - Implement the **Socratic Persona Prompt** in the FastAPI backend chat endpoint (`POST /api/chat`) calling the local **Ollama** model (e.g. `llama3.2`):
    ```text
    You are curiousBuddy, an enthusiastic, highly curious, and slightly skeptical study companion. 
    Your goal is to practice the Feynman Technique with the user. 
    When they tell you what they studied, ask probing, intelligent follow-up questions to test their true understanding. Avoid generic praise; push them to explain the 'why' and 'how'. Keep answers concise.
    ```
- [ ] **2.2 Implement Web Speech API Voice Input:**
  - Add a microphone button using `window.SpeechRecognition || window.webkitSpeechRecognition`.
  - Stream voice transcription directly into the chat input box.

---

### Phase 3: Automated Journaling & Quiz Generator (Hours 9–14)
- [ ] **3.1 Implement Journal Endpoint (`POST /api/generate-journal` in `backend/app/main.py`):**
  - Accept chat transcript and topic.
  - Query Ollama with structured output schema `format=JournalGenerationResponse.model_json_schema()` to return Markdown notes and 3 quiz questions.
- [ ] **3.2 Build `JournalView.tsx`:**
  - Save generated journal items to `localStorage`.
  - Display past entries in collapsible cards with a **"Test Me on This"** modal for quiz questions.

---

### Phase 4: Analytics, Streaks & UI Polish (Hours 15–24)
- [ ] **4.1 Build `StatsDashboard.tsx` & LocalStorage Custom Hook:**
  - Track total study minutes, completed sessions, and daily streaks.
  - Render progress metrics cleanly at the top of the app dashboard.
- [ ] **4.2 Styling & Polish:**
  - Apply dark mode slate styling with glowing accent indicators.
  - Ensure seamless navigation across Timer, Debrief, Journal, and Stats.

---

## 5. Starter Code Templates

### 5.1 Backend FastAPI Server (`backend/app/main.py`)
```python
import os
import ollama
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.schemas import ChatRequest, DebriefRequest, JournalGenerationResponse

load_dotenv()

app = FastAPI(title="curiousBuddy API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
client = ollama.AsyncClient(host=OLLAMA_HOST)

FEYNMAN_SYSTEM_PROMPT = """
You are curiousBuddy, an enthusiastic, highly curious, and slightly skeptical study companion. 
Your goal is to practice the Feynman Technique with the user. 
When they tell you what they studied, ask probing, intelligent follow-up questions to test their true understanding. 
Avoid generic praise; push them to explain the 'why' and 'how' simply. Keep answers concise.
"""

@app.post("/api/chat")
async def chat_endpoint(data: ChatRequest):
    messages = [{"role": "system", "content": FEYNMAN_SYSTEM_PROMPT}] + [
        {"role": "user" if m.sender == "user" else "assistant", "content": m.text}
        for m in data.messages
    ]
    response = await client.chat(model=OLLAMA_MODEL, messages=messages)
    return {"message": response.message.content}

@app.post("/api/generate-journal", response_model=JournalGenerationResponse)
async def generate_journal(data: DebriefRequest):
    conversation_text = "\n".join([f"{m.sender}: {m.text}" for m in data.transcript])
    prompt = f"""
    Analyze this Feynman study debrief conversation about '{data.topic}':
    {conversation_text}
    
    Extract a structured Markdown study journal entry summarizing what was learned using the Feynman technique, and provide 3 quiz questions to test retention.
    """
    response = await client.chat(
        model=OLLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        format=JournalGenerationResponse.model_json_schema(),
    )
    return JournalGenerationResponse.model_validate_json(response.message.content)
```

### 5.2 Backend Requirements (`backend/requirements.txt`)
```text
fastapi
uvicorn
python-dotenv
pydantic
ollama
elevenlabs
```