import { useState, useRef, useEffect, type FC } from 'react';
import type { ChatMessage, JournalEntry } from '../types';
import { sound } from '../utils/sound';

interface AiDebriefProps {
  topic: string;
  durationMinutes: number;
  onSaveJournalEntry: (entry: JournalEntry) => void;
  onBackToTimer: () => void;
}

export const AiDebrief: FC<AiDebriefProps> = ({
  topic,
  durationMinutes,
  onSaveJournalEntry,
  onBackToTimer,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `Hello! I'm curiousBuddy. You just spent ${durationMinutes} minutes studying "${topic || 'your concept'}". To test if you've truly mastered it, explain it to me as if I'm 12 years old. What is the fundamental idea?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isGeneratingJournal, setIsGeneratingJournal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup Web Speech API for voice input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      sound.playClick();
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    sound.playClick();
    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || 'General Topic',
          messages: updatedMessages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          sender: 'ai',
          text: data.message || "That's an interesting explanation. Can you give me a real-world concrete example to prove how it works in practice?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      // Fallback Socratic dialogue simulation if backend Ollama isn't active
      const fallbackQuestions = [
        `You said: "${text.slice(0, 40)}...". But why does it work that way? What happens behind the scenes if something fails?`,
        `That makes sense, but how would you contrast this with other common approaches? What is the main tradeoff?`,
        `Imagine you are building a production system using this. What is the single biggest pitfall someone might encounter?`,
      ];
      const randomQ = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: randomQ,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 700);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAndSaveJournal = async () => {
    sound.playClick();
    setIsGeneratingJournal(true);

    const activeTopicName = topic || 'Feynman Study Session';

    try {
      const res = await fetch('/api/generate-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopicName,
          duration_minutes: durationMinutes,
          transcript: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newEntry: JournalEntry = {
          id: `entry-${Date.now()}`,
          timestamp: new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          topic: data.topic || activeTopicName,
          summaryMarkdown: data.summary_markdown,
          durationMinutes,
          chatTranscript: messages,
          quizQuestions: data.quiz_questions || [
            'What is the primary mechanism of this concept?',
            'What is the most common misconception?',
            'How would you apply this in practice?',
          ],
        };
        onSaveJournalEntry(newEntry);
      } else {
        throw new Error('Generation failed');
      }
    } catch {
      // Fallback client-side journal entry generation
      const newEntry: JournalEntry = {
        id: `entry-${Date.now()}`,
        timestamp: new Date().toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        topic: activeTopicName,
        durationMinutes,
        chatTranscript: messages,
        summaryMarkdown: `### ${activeTopicName} — Feynman Study Summary\n\n- **Core Principle**: Simplified explanation verified via active dialogue.\n- **Key Takeaways**: Focused on mechanical understanding over rote memorization.\n- **Clarifications**: Worked through edge cases and real-world analogies.`,
        quizQuestions: [
          `Can you define ${activeTopicName} in a single sentence without jargon?`,
          `What is the primary constraint or limitation of ${activeTopicName}?`,
          `How would you teach this concept to a beginner in 60 seconds?`,
        ],
      };
      onSaveJournalEntry(newEntry);
    } finally {
      setIsGeneratingJournal(false);
    }
  };

  return (
    <div className="pomodoro-container">
      {/* Session Header Card */}
      <div className="app-navbar debrief-header-nav" style={{ marginBottom: 0 }}>
        <div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            DEBRIEFING SESSION:
          </span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            {topic || 'General Learning Session'} ({durationMinutes}m)
          </h2>
        </div>

        <div className="debrief-nav-actions">
          <button
            type="button"
            className="control-secondary-btn"
            onClick={onBackToTimer}
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            ← Timer
          </button>
          <button
            type="button"
            className="control-primary-btn"
            onClick={handleFinishAndSaveJournal}
            disabled={isGeneratingJournal}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {isGeneratingJournal ? 'Generating Notes...' : 'Save to Journal →'}
          </button>
        </div>
      </div>

      {/* Chat Thread */}
      <div
        className="timer-card"
        style={{
          alignItems: 'stretch',
          gap: '14px',
          minHeight: '440px',
          maxHeight: '520px',
          overflowY: 'auto',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                background: m.sender === 'user' ? '#ffffff' : 'var(--bg-app)',
                color: m.sender === 'user' ? '#000000' : '#f4f4f5',
                border: '1px solid var(--border-color)',
                padding: '12px 16px',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '4px',
                  color: m.sender === 'user' ? '#52525b' : '#71717a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <span>{m.sender === 'user' ? 'YOU' : 'CURIOUSBUDDY (AI)'}</span>
                <span>{m.timestamp}</span>
              </div>
              <div>{m.text}</div>
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                padding: '10px 14px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              curiousBuddy is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="debrief-input-bar">
          <button
            type="button"
            className="control-secondary-btn"
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop Listening' : 'Speak via Microphone'}
            style={{
              padding: '10px 14px',
              color: isListening ? '#ef4444' : 'var(--text-secondary)',
              borderColor: isListening ? '#ef4444' : 'var(--border-color)',
            }}
          >
            {isListening ? '🎙 Listening...' : '🎙 Voice'}
          </button>

          <input
            type="text"
            className="custom-topic-input"
            placeholder="Explain what you learned in simple terms..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            disabled={isLoading}
          />

          <button
            type="button"
            className="control-primary-btn"
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
