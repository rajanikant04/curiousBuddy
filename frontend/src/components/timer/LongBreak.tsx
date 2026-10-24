import { useState, useEffect, useRef, type FC } from 'react';
import type { TimerState } from '../../types';
import { sound } from '../../utils/sound';
import { ClockDial } from './ClockDial';

interface LongBreakProps {
  onSwitchToFocus: () => void;
}

const DEFAULT_LONG_BREAK_SECONDS = 15 * 60;

export const LongBreak: FC<LongBreakProps> = ({ onSwitchToFocus }) => {
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_LONG_BREAK_SECONDS);
  const [totalDuration, setTotalDuration] = useState<number>(DEFAULT_LONG_BREAK_SECONDS);

  const startTimeRef = useRef<number | null>(null);
  const startSecondsRef = useRef<number>(DEFAULT_LONG_BREAK_SECONDS);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = Math.floor(timeLeft % 60);
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.title = `${formatted} - Long Break | curiousBuddy`;
  }, [timeLeft]);

  useEffect(() => {
    if (timerState === 'BREAK') {
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
    setTimeLeft(DEFAULT_LONG_BREAK_SECONDS);
    onSwitchToFocus();
  };

  const handleStartPause = () => {
    sound.playClick();
    if (timerState === 'BREAK') {
      setTimerState('PAUSED');
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      if (timeLeft <= 0) {
        setTimeLeft(DEFAULT_LONG_BREAK_SECONDS);
        setTotalDuration(DEFAULT_LONG_BREAK_SECONDS);
      }
      setTimerState('BREAK');
    }
  };

  const handleReset = () => {
    sound.playClick();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setTimerState('IDLE');
    setTimeLeft(DEFAULT_LONG_BREAK_SECONDS);
    setTotalDuration(DEFAULT_LONG_BREAK_SECONDS);
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

  return (
    <div className="timer-card">
      <div className="topic-picker">
        <div className="topic-label">
          <span>Long Break (15m)</span>
          <span className="topic-sub">Extended recharge cycle. Walk around, stretch, and disconnect</span>
        </div>
      </div>

      <ClockDial
        timeLeft={timeLeft}
        totalDuration={totalDuration}
        timerState={timerState}
        isBreak={true}
        onAdjustTime={handleAdjustTime}
      />

      {/* Controls */}
      <div className="timer-controls">
        <button type="button" className="control-secondary-btn" onClick={handleReset}>
          Reset
        </button>

        <button
          type="button"
          className={`control-primary-btn ${timerState === 'BREAK' ? 'btn-active' : ''}`}
          onClick={handleStartPause}
        >
          {timerState === 'BREAK' ? 'Pause' : timerState === 'PAUSED' ? 'Resume' : 'Start Break'}
        </button>

        <button
          type="button"
          className="control-secondary-btn"
          onClick={() => {
            sound.playClick();
            onSwitchToFocus();
          }}
        >
          Back to Focus
        </button>
      </div>
    </div>
  );
};
