import { type FC } from 'react';
import type { TimerState } from '../../types';

interface ClockDialProps {
  timeLeft: number;
  totalDuration: number;
  timerState: TimerState;
  isBreak?: boolean;
  topicName?: string;
  onAdjustTime: (deltaMinutes: number) => void;
}

export const ClockDial: FC<ClockDialProps> = ({
  timeLeft,
  totalDuration,
  timerState,
  isBreak = false,
  topicName,
  onAdjustTime,
}) => {
  const RADIUS = 135;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Before starting session (IDLE/READY), circle is always 100% full (no black gap)
  const remainingFraction = timerState === 'IDLE'
    ? 1
    : (totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0);
  const strokeDashoffset = CIRCUMFERENCE * (1 - remainingFraction);

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = Math.floor(timeLeft % 60);
  const formattedMinutes = String(displayMinutes).padStart(2, '0');
  const formattedSeconds = String(displaySeconds).padStart(2, '0');

  return (
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

        {topicName && !isBreak && (
          <div className="current-topic-badge" title={topicName}>
            {topicName}
          </div>
        )}

        {/* Quick +/- 5 min adjusters */}
        <div className="time-adjusters">
          <button
            type="button"
            className="adjust-btn"
            onClick={() => onAdjustTime(-5)}
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
            onClick={() => onAdjustTime(5)}
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
  );
};
