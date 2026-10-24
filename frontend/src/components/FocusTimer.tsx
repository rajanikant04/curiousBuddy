import { useState, type FC } from 'react';
import type { TimerMode } from '../types';
import { sound } from '../utils/sound';
import { Focus } from './timer/Focus';
import { ShortBreak } from './timer/ShortBreak';
import { LongBreak } from './timer/LongBreak';

interface FocusTimerProps {
  onStartDebrief: (topic: string, durationMinutes: number) => void;
  onSessionComplete: (minutes: number) => void;
}

export const FocusTimer: FC<FocusTimerProps> = ({
  onStartDebrief,
  onSessionComplete,
}) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const toggleSound = () => {
    const updated = !soundEnabled;
    setSoundEnabled(updated);
    sound.setSoundEnabled(updated);
    if (updated) sound.playClick();
  };

  const handleSessionDone = (minutes: number) => {
    setCompletedSessions((prev) => prev + 1);
    onSessionComplete(minutes);
  };

  return (
    <div className="pomodoro-container">
      {/* Top Header & Streak Status */}
      <header className="pomodoro-header">
        <div className="brand-badge">
          <span className="brand-dot" />
          <span>FEYNMAN ACTIVE LEARNING</span>
        </div>
        <div className="pomodoro-stats-strip">
          <div className="stat-pill">
            <span className="stat-value">{completedSessions}</span>
            <span className="stat-label">Sessions</span>
          </div>
          <button
            type="button"
            className={`sound-toggle-btn ${soundEnabled ? 'active' : ''}`}
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? 'Sound: On' : 'Sound: Off'}
          </button>
        </div>
      </header>

      {/* Mode Selector Tabs (Rectangular) */}
      <div className="mode-tabs">
        <button
          type="button"
          className={`tab-btn ${mode === 'work' ? 'tab-btn-active' : ''}`}
          onClick={() => {
            sound.playClick();
            setMode('work');
          }}
        >
          <span>Focus (25m)</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${mode === 'shortBreak' ? 'tab-btn-active-break' : ''}`}
          onClick={() => {
            sound.playClick();
            setMode('shortBreak');
          }}
        >
          <span>Short Break (5m)</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${mode === 'longBreak' ? 'tab-btn-active-break' : ''}`}
          onClick={() => {
            sound.playClick();
            setMode('longBreak');
          }}
        >
          <span>Long Break (15m)</span>
        </button>
      </div>

      {/* 3 Sub-Components: Focus | ShortBreak | LongBreak */}
      {mode === 'work' && (
        <Focus
          onSessionComplete={handleSessionDone}
          onStartDebrief={onStartDebrief}
          onSwitchToBreak={(b) => setMode(b)}
        />
      )}

      {mode === 'shortBreak' && (
        <ShortBreak onSwitchToFocus={() => setMode('work')} />
      )}

      {mode === 'longBreak' && (
        <LongBreak onSwitchToFocus={() => setMode('work')} />
      )}

      {/* Cycle Indicator Footer */}
      <footer className="pomodoro-footer">
        <div className="cycle-track">
          {[0, 1, 2, 3].map((step) => (
            <div
              key={step}
              className={`cycle-step ${step < (completedSessions % 4) ? 'completed' : ''}`}
            >
              <span className="step-dot" />
              <span className="step-text">SESSION {step + 1}</span>
            </div>
          ))}
        </div>
        <p className="feynman-quote">
          “If you want to master something, teach it. The more simply you explain it, the deeper you understand it.” — Richard Feynman
        </p>
      </footer>
    </div>
  );
};
