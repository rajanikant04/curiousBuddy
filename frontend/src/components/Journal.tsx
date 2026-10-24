import { useState, type FC } from 'react';
import type { JournalEntry } from '../types';
import { sound } from '../utils/sound';

interface JournalProps {
  entries: JournalEntry[];
  onStartNewSession: () => void;
}

export const Journal: FC<JournalProps> = ({ entries, onStartNewSession }) => {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(
    entries.length > 0 ? entries[0] : null
  );
  const [activeQuizEntry, setActiveQuizEntry] = useState<JournalEntry | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const handleOpenQuiz = (entry: JournalEntry) => {
    sound.playClick();
    setActiveQuizEntry(entry);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const handleCloseQuiz = () => {
    sound.playClick();
    setActiveQuizEntry(null);
  };

  return (
    <div className="pomodoro-container">
      {/* Header */}
      <div className="app-navbar journal-header-nav" style={{ marginBottom: 0 }}>
        <div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            STUDY ARCHIVE:
          </span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            Feynman Notes & Retention Quizzes ({entries.length})
          </h2>
        </div>

        <button
          type="button"
          className="control-primary-btn"
          onClick={onStartNewSession}
          style={{ padding: '8px 16px', fontSize: '12px' }}
        >
          + New Focus Session
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="timer-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>
            No Study Entries Yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px', marginBottom: '20px' }}>
            Complete a focus session and debrief with curiousBuddy to generate structured Markdown notes and instant flashcard quizzes.
          </p>
          <button type="button" className="control-primary-btn" onClick={onStartNewSession}>
            Start First Focus Session
          </button>
        </div>
      ) : (
        <div className="journal-layout-grid">
          {/* Entries Sidebar List */}
          <div className="journal-sidebar">
            {entries.map((entry) => {
              const isSelected = selectedEntry?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedEntry(entry);
                  }}
                  style={{
                    background: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#000000' : 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    {entry.topic}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: isSelected ? '#3f3f46' : 'var(--text-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{entry.timestamp}</span>
                    <span>{entry.durationMinutes}m</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Entry Detail View */}
          {selectedEntry && (
            <div
              className="timer-card"
              style={{
                alignItems: 'stretch',
                padding: '24px',
                gap: '18px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '16px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                    {selectedEntry.topic}
                  </h3>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Studied on {selectedEntry.timestamp} · {selectedEntry.durationMinutes} minutes focus
                  </div>
                </div>

                <button
                  type="button"
                  className="control-primary-btn"
                  onClick={() => handleOpenQuiz(selectedEntry)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Quiz Me ({selectedEntry.quizQuestions?.length || 3})
                </button>
              </div>

              {/* Markdown Content */}
              <div
                style={{
                  fontSize: '13px',
                  lineHeight: '1.7',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {selectedEntry.summaryMarkdown}
              </div>

              {/* Chat Transcript preview */}
              {selectedEntry.chatTranscript && selectedEntry.chatTranscript.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      marginBottom: '10px',
                    }}
                  >
                    DEBRIEF TRANSCRIPT ({selectedEntry.chatTranscript.length} messages)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedEntry.chatTranscript.map((msg, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          padding: '8px 12px',
                          fontSize: '12px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: msg.sender === 'user' ? '#a855f7' : '#10b981',
                            marginRight: '8px',
                          }}
                        >
                          {msg.sender === 'user' ? 'YOU:' : 'BUDDY:'}
                        </span>
                        <span>{msg.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quiz Modal */}
      {activeQuizEntry && (
        <div className="quiz-modal-backdrop">
          <div className="quiz-modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  RETENTION QUIZ:
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                  {activeQuizEntry.topic}
                </h3>
              </div>
              <button type="button" className="control-secondary-btn" onClick={handleCloseQuiz}>
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeQuizEntry.quizQuestions.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-app)',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                    {idx + 1}. {q}
                  </div>
                  <textarea
                    rows={2}
                    className="custom-topic-input"
                    placeholder="Type your answer from memory..."
                    value={quizAnswers[idx] || ''}
                    onChange={(e) => setQuizAnswers({ ...quizAnswers, [idx]: e.target.value })}
                    disabled={quizSubmitted}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {!quizSubmitted ? (
                <button
                  type="button"
                  className="control-primary-btn"
                  onClick={() => {
                    sound.playSessionCompleteChime();
                    setQuizSubmitted(true);
                  }}
                >
                  Submit Answers
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                    ✓ Answers Recorded! Great active recall.
                  </span>
                  <button type="button" className="control-primary-btn" onClick={handleCloseQuiz}>
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
