import { useState, useEffect, useRef, type FC } from 'react';
import type { TimerState } from '../../types';
import { sound } from '../../utils/sound';
import { ClockDial } from './ClockDial';

interface FocusProps {
  onSessionComplete: (minutes: number) => void;
  onStartDebrief: (topic: string, durationMinutes: number) => void;
  onSwitchToBreak: (mode: 'shortBreak' | 'longBreak') => void;
}

const DEFAULT_WORK_SECONDS = 25 * 60;

const SUGGESTED_TOPICS = [
  'React Architecture',
  'Data Structures & Algorithms',
  'System Design',
  'Neural Networks',
  'Quantum Computing',
];

export const Focus: FC<FocusProps> = ({
  onSessionComplete,
  onStartDebrief,
  onSwitchToBreak,
}) => {
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_WORK_SECONDS);
  const [totalDuration, setTotalDuration] = useState<number>(DEFAULT_WORK_SECONDS);
  const [topic, setTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  const startTimeRef = useRef<number | null>(null);
  const startSecondsRef = useRef<number>(DEFAULT_WORK_SECONDS);
  const animFrameRef = useRef<number | null>(null);

  // Sync browser title
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = Math.floor(timeLeft % 60);
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.title = `${formatted} - Focus | curiousBuddy`;
  }, [timeLeft]);

  // Real-time countdown loop
  useEffect(() => {
    if (timerState === 'WORKING') {
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
          handleComplete();
          return;
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [timerState]);

  const handleComplete = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    sound.playSessionCompleteChime();
    setTimerState('IDLE');
    setTimeLeft(0);
    setShowCelebration(true);
    const minutesCompleted = Math.round(totalDuration / 60);
    onSessionComplete(minutesCompleted);
  };

  const handleStartPause = () => {
    sound.playClick();
    if (timerState === 'WORKING') {
      setTimerState('PAUSED');
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      if (timeLeft <= 0) {
        setTimeLeft(DEFAULT_WORK_SECONDS);
        setTotalDuration(DEFAULT_WORK_SECONDS);
      }
      setTimerState('WORKING');
    }
  };

  const handleReset = () => {
    sound.playClick();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setTimerState('IDLE');
    setTimeLeft(DEFAULT_WORK_SECONDS);
    setTotalDuration(DEFAULT_WORK_SECONDS);
    setShowCelebration(false);
  };

  const handleAdjustTime = (deltaMinutes: number) => {
    sound.playClick();
    const deltaSeconds = deltaMinutes * 60;

    if (timerState === 'IDLE') {
      // In IDLE/READY: modify the total session duration directly
      const newDuration = Math.max(60, totalDuration + deltaSeconds);
      setTotalDuration(newDuration);
      setTimeLeft(newDuration);
      startSecondsRef.current = newDuration;
    } else {
      // In active session: add/subtract from remaining and total duration
      const newTimeLeft = Math.max(60, timeLeft + deltaSeconds);
      setTimeLeft(newTimeLeft);
      setTotalDuration((prev) => Math.max(newTimeLeft, prev + deltaSeconds));
      startSecondsRef.current = newTimeLeft;
      startTimeRef.current = performance.now();
    }
  };

  const activeTopic = (topic === 'custom' ? customTopic : topic).trim() || 'General Learning Session';

  return (
    <div className="timer-card">
      {/* Topic Selection */}
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

      {/* Clock Dial */}
      <ClockDial
        timeLeft={timeLeft}
        totalDuration={totalDuration}
        timerState={timerState}
        topicName={activeTopic}
        onAdjustTime={handleAdjustTime}
      />

      {/* Controls */}
      <div className="timer-controls">
        <button type="button" className="control-secondary-btn" onClick={handleReset}>
          Reset
        </button>

        <button
          type="button"
          className={`control-primary-btn ${timerState === 'WORKING' ? 'btn-active' : ''}`}
          onClick={handleStartPause}
        >
          {timerState === 'WORKING' ? 'Pause' : timerState === 'PAUSED' ? 'Resume' : 'Start Focus'}
        </button>

        <button
          type="button"
          className="control-secondary-btn"
          onClick={() => onSwitchToBreak('shortBreak')}
          title="Skip to Short Break"
        >
          Skip to Break
        </button>
      </div>

      {/* Debrief Banner Notification */}
      {(showCelebration || timerState === 'PAUSED') && (
        <div className="debrief-banner">
          <div className="banner-text">
            <h4>Ready to test what you learned?</h4>
            <p>
              Explain "{activeTopic}" in simple terms to curiousBuddy using the Feynman technique.
            </p>
          </div>
          <button
            type="button"
            className="debrief-cta-btn"
            onClick={() => {
              sound.playClick();
              onStartDebrief(activeTopic, Math.round(totalDuration / 60));
            }}
          >
            Start Feynman Debrief →
          </button>
        </div>
      )}
    </div>
  );
};
