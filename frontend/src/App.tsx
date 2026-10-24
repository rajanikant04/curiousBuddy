import { useState } from 'react';
import type { JournalEntry, UserStats } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { FocusTimer } from './components/FocusTimer';
import { AiDebrief } from './components/AiDebrief';
import { Journal } from './components/Journal';
import { Stats } from './components/Stats';

type ActiveTab = 'timer' | 'debrief' | 'journal' | 'stats';

const DEFAULT_STATS: UserStats = {
  totalMinutesStudied: 0,
  currentStreakDays: 1,
  lastActiveDate: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  sessionsCompleted: 0,
};

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('timer');
  const [activeSession, setActiveSession] = useState<{
    topic: string;
    durationMinutes: number;
  }>({
    topic: '',
    durationMinutes: 25,
  });

  const [journalEntries, setJournalEntries] = useLocalStorage<JournalEntry[]>(
    'curiousbuddy_journals',
    []
  );

  const [userStats, setUserStats] = useLocalStorage<UserStats>(
    'curiousbuddy_stats',
    DEFAULT_STATS
  );

  // When timer completes or user initiates debrief
  const handleStartDebrief = (topic: string, durationMinutes: number) => {
    setActiveSession({ topic, durationMinutes });
    setActiveTab('debrief');
  };

  // When focus block completes, update stats
  const handleSessionComplete = (minutes: number) => {
    setUserStats((prev) => ({
      ...prev,
      totalMinutesStudied: prev.totalMinutesStudied + minutes,
      sessionsCompleted: prev.sessionsCompleted + 1,
      lastActiveDate: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));
  };

  // When debrief notes are finalized
  const handleSaveJournalEntry = (entry: JournalEntry) => {
    setJournalEntries((prev) => [entry, ...prev]);
    setActiveTab('journal');
  };

  const handleResetStats = () => {
    setUserStats(DEFAULT_STATS);
  };

  return (
    <div className="app-container">
      {/* Top Application Navbar */}
      <header className="app-navbar">
        <div className="brand-wrapper">
          <div className="brand-logo-icon">CB</div>
          <div className="brand-text-block">
            <h1>curiousBuddy</h1>
            <p>Active Feynman Learning</p>
          </div>
        </div>

        {/* 4 Tab Navigation */}
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            <span>Focus Timer</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'debrief' ? 'active' : ''}`}
            onClick={() => setActiveTab('debrief')}
          >
            <span>AI Debrief</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            <span>Journal</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span>Stats</span>
          </button>
        </nav>
      </header>

      {/* Main 4 Components Switcher */}
      <main>
        {activeTab === 'timer' && (
          <FocusTimer
            onStartDebrief={handleStartDebrief}
            onSessionComplete={handleSessionComplete}
          />
        )}

        {activeTab === 'debrief' && (
          <AiDebrief
            topic={activeSession.topic}
            durationMinutes={activeSession.durationMinutes}
            onSaveJournalEntry={handleSaveJournalEntry}
            onBackToTimer={() => setActiveTab('timer')}
          />
        )}

        {activeTab === 'journal' && (
          <Journal
            entries={journalEntries}
            onStartNewSession={() => setActiveTab('timer')}
          />
        )}

        {activeTab === 'stats' && (
          <Stats
            stats={userStats}
            onResetStats={handleResetStats}
            onStartFocus={() => setActiveTab('timer')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
