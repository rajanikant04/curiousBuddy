export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
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

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type TimerState = 'IDLE' | 'WORKING' | 'PAUSED' | 'BREAK';

export interface PomodoroConfig {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
}

