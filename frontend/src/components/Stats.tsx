import { type FC } from 'react';
import type { UserStats } from '../types';
import { sound } from '../utils/sound';

interface StatsProps {
  stats: UserStats;
  onResetStats?: () => void;
  onStartFocus: () => void;
}

export const Stats: FC<StatsProps> = ({ stats, onResetStats, onStartFocus }) => {
  const hours = (stats.totalMinutesStudied / 60).toFixed(1);

  return (
    <div className="pomodoro-container">
      {/* Header */}
      <div className="app-navbar stats-header-nav" style={{ marginBottom: 0 }}>
        <div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            LOCAL STORAGE ANALYTICS:
          </span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            Focus Minutes & Streak Metrics
          </h2>
        </div>

        <button
          type="button"
          className="control-primary-btn"
          onClick={onStartFocus}
          style={{ padding: '8px 16px', fontSize: '12px' }}
        >
          Start Focus
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="stats-metric-grid">
        <div className="timer-card" style={{ alignItems: 'flex-start', padding: '20px', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            TOTAL FOCUS TIME
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
            {stats.totalMinutesStudied} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>min</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ≈ {hours} total study hours
          </div>
        </div>

        <div className="timer-card" style={{ alignItems: 'flex-start', padding: '20px', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            CURRENT STREAK
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
            {stats.currentStreakDays} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>days</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Last active: {stats.lastActiveDate || 'Today'}
          </div>
        </div>

        <div className="timer-card" style={{ alignItems: 'flex-start', padding: '20px', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            SESSIONS COMPLETED
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
            {stats.sessionsCompleted} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>blocks</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Pomodoros completed
          </div>
        </div>

        <div className="timer-card" style={{ alignItems: 'flex-start', padding: '20px', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            RETENTION METHOD
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>
            Feynman AI
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Socratic dialogue + active recall
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="timer-card" style={{ alignItems: 'stretch', padding: '24px', gap: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>
          THE FEYNMAN LEARNING LOOP
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Active learning relies on testing your comprehension right after studying. When a focus timer ends, explaining concepts in simple language forces you to identify knowledge gaps immediately, building durable long-term retention.
        </p>

        {onResetStats && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              className="control-secondary-btn"
              onClick={() => {
                sound.playClick();
                if (confirm('Reset your study statistics?')) {
                  onResetStats();
                }
              }}
              style={{ fontSize: '11px', color: 'var(--text-muted)' }}
            >
              Reset All Stats
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
