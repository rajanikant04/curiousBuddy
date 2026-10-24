import { useState, useEffect, useRef, type FC } from 'react';
import type { TimerMode, TimerState } from '../types';
import { sound } from '../utils/sound';

interface PomodoroTimerProps {
  onStartDebrief?: (topic: string, durationMinutes: number) => void;
  onSessionComplete?: (minutes: number) => void;
}

const DEFAULT_DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const SUGGESTED_TOPICS = [
  'React Architecture',
  'Data Structures & Algorithms',
  'System Design',
  'Neural Networks',
  'Quantum Computing',
];

export const PomodoroTimer: FC<PomodoroTimerProps> = ({
  onStartDebrief,
  onSessionComplete,
}) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_DURATIONS.work);
  const [totalDuration, setTotalDuration] = useState<number>(DEFAULT_DURATIONS.work);
  const [topic, setTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Drift-free reference tracking
  const startTimeRef = useRef<number | null>(null);
  const startSecondsRef = useRef<number>(DEFAULT_DURATIONS.work);
  const animFrameRef = useRef<number | null>(null);

  // Sync browser tab title
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = Math.floor(timeLeft % 60);
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const modeLabel = mode === 'work' ? 'Focus' : 'Break';
    document.title = `${formatted} - ${modeLabel} | curiousBuddy`;
  }, [timeLeft, mode]);

  // High-precision clock simulation loop
  useEffect(() => {
    if (timerState === 'WORKING' || timerState === 'BREAK') {
      startTimeRef.current = performance.now();
      startSecondsRef.current = timeLeft;

      const tick = () => {
        if (!startTimeRef.current) return;
        const now = performance.now();
        const elapsedSec = (now - startTimeRef.current) / 1000;
        const remaining = Math.max(0, startSecondsRef.current - elapsedSec);

        setTimeLeft(remaining);

        if (remaining <= 0.05) {
          setTimeLeft(0);
          handleTimerComplete();
          return;
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [timerState]);

  const handleTimerComplete = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    sound.playSessionCompleteChime();

    if (mode === 'work') {
      const minutesCompleted = Math.round(totalDuration / 60);
      setCompletedPomodoros((prev) => prev + 1);
      setShowCelebration(true);
      setTimerState('IDLE');
      setTimeLeft(0);

      if (onSessionComplete) {
        onSessionComplete(minutesCompleted);
      }
    } else {
      setMode('work');
      setTimeLeft(DEFAULT_DURATIONS.work);
      setTotalDuration(DEFAULT_DURATIONS.work);
      setTimerState('IDLE');
    }
  };

  const handleStartPause = () => {
    sound.playClick();
    if (timerState === 'WORKING' || timerState === 'BREAK') {
      setTimerState('PAUSED');
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      if (timeLeft <= 0) {
        setTimeLeft(DEFAULT_DURATIONS[mode]);
        setTotalDuration(DEFAULT_DURATIONS[mode]);
      }
      setTimerState(mode === 'work' ? 'WORKING' : 'BREAK');
    }
  };

  const handleReset = () => {
    sound.playClick();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setTimerState('IDLE');
    setTimeLeft(DEFAULT_DURATIONS[mode]);
    setTotalDuration(DEFAULT_DURATIONS[mode]);
    setShowCelebration(false);
  };

  const handleModeChange = (newMode: TimerMode) => {
    sound.playClick();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setMode(newMode);
    setTimerState('IDLE');
    setTimeLeft(DEFAULT_DURATIONS[newMode]);
    setTotalDuration(DEFAULT_DURATIONS[newMode]);
    setShowCelebration(false);
  };

  const handleAdjustTime = (deltaMinutes: number) => {
    sound.playClick();
    const deltaSeconds = deltaMinutes * 60;

    if (timerState === 'IDLE') {
      const newDuration = Math.max(60, totalDuration + deltaSeconds);
      setTotalDuration(newDuration);
      setTimeLeft(newDuration);
      startSecondsRef.current = newDuration;
    } else {
      const newTimeLeft = Math.max(60, timeLeft + deltaSeconds);
      setTimeLeft(newTimeLeft);
      setTotalDuration((prev) => Math.max(newTimeLeft, prev + deltaSeconds));
      startSecondsRef.current = newTimeLeft;
      startTimeRef.current = performance.now();
    }
  };


  const toggleSound = () => {
    const updated = !soundEnabled;
    setSoundEnabled(updated);
    sound.setSoundEnabled(updated);
    if (updated) sound.playClick();
  };

  const currentTopicName = topic === 'custom' ? customTopic : topic;

  const triggerDebrief = () => {
    sound.playClick();
    const activeTopic = currentTopicName.trim() || 'General Learning Session';
    const duration = Math.round(totalDuration / 60);
    if (onStartDebrief) {
      onStartDebrief(activeTopic, duration);
    }
  };

  // Clock Dial Geometry
  const RADIUS = 140;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Before starting session (IDLE/READY), circle is always 100% full (no black gap)
  const remainingFraction = timerState === 'IDLE'
    ? 1
    : (totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0);
  
  // Progress stroke: starts full, smoothly sweeps clockwise
  const strokeDashoffset = CIRCUMFERENCE * (1 - remainingFraction);



  // Display time
  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = Math.floor(timeLeft % 60);
  const formattedMinutes = String(displayMinutes).padStart(2, '0');
  const formattedSeconds = String(displaySeconds).padStart(2, '0');

  const isBreak = mode !== 'work';

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
            <span className="stat-value">{completedPomodoros}</span>
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
          onClick={() => handleModeChange('work')}
        >
          <span>Focus (25m)</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${mode === 'shortBreak' ? 'tab-btn-active-break' : ''}`}
          onClick={() => handleModeChange('shortBreak')}
        >
          <span>Short Break (5m)</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${mode === 'longBreak' ? 'tab-btn-active-break' : ''}`}
          onClick={() => handleModeChange('longBreak')}
        >
          <span>Long Break (15m)</span>
        </button>
      </div>

      {/* Main Timer Card (Rectangular, Radius 0) */}
      <div className="timer-card">
        {/* Topic Input section during work */}
        {mode === 'work' && (
          <div className="topic-picker">
            <div className="topic-label">
              <span>Study Concept</span>
              <span className="topic-sub">curiousBuddy will debrief you on this topic</span>
            </div>
            <div className="topic-pills">
              {SUGGESTED_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`topic-pill ${topic === t ? 'topic-pill-active' : ''}`}
                  onClick={() => {
                    setTopic(t);
                    sound.playClick();
                  }}
                >
                  {t}
                </button>
              ))}
              <button
                type="button"
                className={`topic-pill ${topic === 'custom' ? 'topic-pill-active' : ''}`}
                onClick={() => {
                  setTopic('custom');
                  sound.playClick();
                }}
              >
                + Custom Topic
              </button>
            </div>

            {topic === 'custom' && (
              <input
                type="text"
                placeholder="e.g. Async JavaScript & Event Loop..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="custom-topic-input"
                autoFocus
              />
            )}
          </div>
        )}

        {/* Minimal Precision Clock Dial */}
        <div className="radial-wrapper">
          <svg className="radial-svg" viewBox="0 0 320 320">
            {/* Background Track */}
            <circle
              className="radial-track"
              cx="160"
              cy="160"
              r={RADIUS}
              strokeWidth="6"
              stroke="#27272a"
              fill="none"
            />

            {/* Simple Progress Ring */}
            <circle
              className="radial-progress"
              cx="160"
              cy="160"
              r={RADIUS}
              strokeWidth="6"
              stroke={isBreak ? '#10b981' : '#ffffff'}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              fill="none"
              transform="rotate(-90 160 160)"
            />
          </svg>

          {/* Centered Countdown Readout */}
          <div className="dial-content">
            <div className={`status-badge status-${timerState.toLowerCase()}`}>
              <span className="pulse-dot" />
              {timerState === 'IDLE' && 'READY'}
              {timerState === 'WORKING' && 'FOCUS'}
              {timerState === 'PAUSED' && 'PAUSED'}
              {timerState === 'BREAK' && 'BREAK'}
            </div>

            <div className="digital-time">
              <span className="time-part">{formattedMinutes}</span>
              <span className="time-colon">:</span>
              <span className="time-part">{formattedSeconds}</span>
            </div>

            {currentTopicName && mode === 'work' && (
              <div className="current-topic-badge" title={currentTopicName}>
                {currentTopicName}
              </div>
            )}

            {/* Quick +/- 5 min adjusters */}
            <div className="time-adjusters">
              <button
                type="button"
                className="adjust-btn"
                onClick={() => handleAdjustTime(-5)}
                disabled={timerState === 'WORKING' || timerState === 'BREAK' || timeLeft <= 300}
                title={
                  timerState === 'WORKING' || timerState === 'BREAK'
                    ? 'Pause session to modify duration'
                    : 'Subtract 5 minutes'
                }
              >
                -5m
              </button>
              <button
                type="button"
                className="adjust-btn"
                onClick={() => handleAdjustTime(5)}
                disabled={timerState === 'WORKING' || timerState === 'BREAK'}
                title={
                  timerState === 'WORKING' || timerState === 'BREAK'
                    ? 'Pause session to modify duration'
                    : 'Add 5 minutes'
                }
              >
                +5m
              </button>
            </div>
          </div>
        </div>


        {/* Primary Rectangular Controls */}
        <div className="timer-controls">
          <button
            type="button"
            className="control-secondary-btn"
            onClick={handleReset}
          >
            <span>Reset</span>
          </button>

          <button
            type="button"
            className={`control-primary-btn ${
              timerState === 'WORKING' || timerState === 'BREAK' ? 'btn-active' : ''
            }`}
            onClick={handleStartPause}
          >
            {timerState === 'WORKING' || timerState === 'BREAK' ? (
              <span>Pause</span>
            ) : (
              <span>{timerState === 'PAUSED' ? 'Resume' : 'Start Focus'}</span>
            )}
          </button>

          <button
            type="button"
            className="control-secondary-btn"
            onClick={handleTimerComplete}
          >
            <span>Skip</span>
          </button>
        </div>

        {/* Debrief Banner Notification */}
        {(showCelebration || timerState === 'PAUSED' || completedPomodoros > 0) && (
          <div className="debrief-banner">
            <div className="banner-text">
              <h4>Ready to test what you learned?</h4>
              <p>
                {currentTopicName
                  ? `Explain "${currentTopicName}" in simple terms to curiousBuddy using the Feynman technique.`
                  : 'Let curiousBuddy test your comprehension with probing Socratic questions.'}
              </p>
            </div>
            <button
              type="button"
              className="debrief-cta-btn"
              onClick={triggerDebrief}
            >
              <span>Start Feynman Debrief →</span>
            </button>
          </div>
        )}
      </div>

      {/* Cycle Indicator Footer */}
      <footer className="pomodoro-footer">
        <div className="cycle-track">
          {[0, 1, 2, 3].map((step) => (
            <div
              key={step}
              className={`cycle-step ${step < (completedPomodoros % 4) ? 'completed' : ''}`}
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
