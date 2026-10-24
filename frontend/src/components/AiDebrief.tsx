import { useState, useRef, useEffect, type FC } from 'react';
import { useConversation } from '@11labs/react';
import type { ChatMessage, JournalEntry } from '../types';
import { sound } from '../utils/sound';

interface AiDebriefProps {
  topic: string;
  durationMinutes: number;
  onSaveJournalEntry: (entry: JournalEntry) => void;
  onBackToTimer: () => void;
}

const DEFAULT_AGENT_ID =
  import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_8001m5pswf1decw9rddgvezyysgz';

export const AiDebrief: FC<AiDebriefProps> = ({
  topic,
  durationMinutes,
  onSaveJournalEntry,
  onBackToTimer,
}) => {
  const [debriefMode, setDebriefMode] = useState<'voice' | 'text'>('voice');
  const [agentId, setAgentId] = useState<string>(DEFAULT_AGENT_ID);
  const [showAgentSettings, setShowAgentSettings] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `Hey there! Great focus session. I'm Cube, your curious study buddy. You just spent ${durationMinutes} minutes studying "${topic || 'your concept'}". What's the core concept you just studied? Explain it to me as if I'm 12 years old!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isGeneratingJournal, setIsGeneratingJournal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const liveTranscriptEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // ElevenLabs Conversational AI custom hook
  const conversation = useConversation({
    onConnect: () => {
      sound.playSessionCompleteChime();
    },
    onDisconnect: () => {
      sound.playClick();
    },
    onMessage: (message: any) => {
      if (message && message.message) {
        const text = String(message.message).trim();
        const role = message.source === 'ai' ? 'ai' : 'user';
        if (text) {
          setMessages((prev) => [
            ...prev,
            {
              sender: role,
              text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      }
    },
    onError: (err: any) => {
      console.error('ElevenLabs Voice Agent Error:', err);
    },
  });

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';
  const isSpeaking = conversation.isSpeaking;

  useEffect(() => {
    if (debriefMode === 'text') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      liveTranscriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, debriefMode]);

  const handleStartVoiceCall = async () => {
    sound.playClick();
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: agentId || DEFAULT_AGENT_ID,
      });
    } catch (err: any) {
      console.error('Failed to start voice call:', err);
      alert(`Could not start call with Cube: ${err?.message || 'Check microphone permissions'}`);
    }
  };

  const handleEndVoiceCall = async () => {
    sound.playClick();
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('Error ending conversation:', err);
    }
  };

  // Setup Web Speech API for voice input fallback in text mode
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
          text:
            data.message ||
            "That's a good start, but can you give me a real-world example? What happens behind the scenes?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      // Socratic dialogue fallback
      const fallbackQuestions = [
        `You said: "${text.slice(0, 45)}...". But why does it work that way? What's the mechanical reason?`,
        `That makes sense, but how would you contrast this with alternative approaches? What is the core tradeoff?`,
        `Imagine explaining this to a 12-year-old without using any technical buzzwords. What simple analogy would you use?`,
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

    // If still in active call, close it gracefully
    if (isConnected) {
      await conversation.endSession().catch(() => {});
    }

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
        summaryMarkdown: `### ${activeTopicName} — Feynman Debrief with Cube\n\n- **Core Principle**: Simplified explanation tested via active Feynman dialogue.\n- **Jargon Elimination**: Replaced technical buzzwords with intuitive real-world mechanics.\n- **Retention Check**: Verified core concept boundaries and failure modes.`,
        quizQuestions: [
          `Can you define ${activeTopicName} in a single sentence without any technical buzzwords?`,
          `What is the primary limitation or edge-case failure mode of ${activeTopicName}?`,
          `If you had to teach this concept to a beginner in 60 seconds, what analogy would you use?`,
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
            SOCRATIC FEYNMAN DEBRIEF:
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

      {/* Debrief Mode Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderBottom: 'none',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setDebriefMode('voice')}
            className={`control-secondary-btn ${debriefMode === 'voice' ? 'active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              background: debriefMode === 'voice' ? '#ffffff' : 'transparent',
              color: debriefMode === 'voice' ? '#000000' : 'var(--text-secondary)',
            }}
          >
            🎙️ Voice Debrief (Cube)
          </button>
          <button
            type="button"
            onClick={() => setDebriefMode('text')}
            className={`control-secondary-btn ${debriefMode === 'text' ? 'active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              background: debriefMode === 'text' ? '#ffffff' : 'transparent',
              color: debriefMode === 'text' ? '#000000' : 'var(--text-secondary)',
            }}
          >
            💬 Text Chat & Notes ({messages.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAgentSettings((prev) => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
        </button>
      </div>

      {/* Mode 1: Centered Custom ElevenLabs Voice Agent Stage */}
      {debriefMode === 'voice' ? (
        <div className="timer-card cube-voice-stage">
          {/* Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              border: '1px solid var(--border-color)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              background: '#09090b',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? (isSpeaking ? '#38bdf8' : '#22c55e') : '#71717a',
                boxShadow: isConnected
                  ? isSpeaking
                    ? '0 0 10px #38bdf8'
                    : '0 0 10px #22c55e'
                  : 'none',
              }}
            />
            {isConnecting
              ? 'CONNECTING TO CUBE...'
              : isConnected
                ? isSpeaking
                  ? 'CUBE IS SPEAKING...'
                  : 'CUBE IS LISTENING TO YOU'
                : 'CUBE READY • VOICE SOCRATIC DEBRIEF'}
          </div>

          {/* Central Animated Orb */}
          <div className="cube-orb-container">
            <div
              className={`cube-orb-core ${
                isConnecting
                  ? 'connecting'
                  : isConnected
                    ? isSpeaking
                      ? 'speaking'
                      : 'listening'
                    : 'idle'
              }`}
            >
              <span
                style={{
                  fontSize: '26px',
                  lineHeight: '1',
                  filter: isConnected ? 'drop-shadow(0 0 8px #ffffff)' : 'none',
                }}
              >
                {isConnected ? (isSpeaking ? '🗣️' : '👂') : '🎙️'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: isConnected ? '#ffffff' : 'var(--text-muted)',
                  marginTop: '6px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                CUBE
              </span>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              {isConnected ? `Debriefing "${topic || 'Session'}"` : 'Practice the Feynman Technique with Cube'}
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                maxWidth: '480px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              {isConnected
                ? 'Speak clearly into your microphone. Explain the core mechanism without jargon. Cube will reply out loud.'
                : 'Click the button below to start talking. Explain what you just studied as if Cube is 12 years old.'}
            </p>
          </div>

          {/* Center Call Action Button */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%' }}>
            {!isConnected && !isConnecting && (
              <button
                type="button"
                className="control-primary-btn"
                onClick={handleStartVoiceCall}
                style={{
                  padding: '14px 36px',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  background: '#ffffff',
                  color: '#000000',
                }}
              >
                🎙️ Start Spoken Debrief with Cube
              </button>
            )}

            {isConnecting && (
              <button
                type="button"
                className="control-secondary-btn"
                disabled
                style={{
                  padding: '14px 36px',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                }}
              >
                Connecting with Cube...
              </button>
            )}

            {isConnected && (
              <button
                type="button"
                className="control-primary-btn"
                onClick={handleEndVoiceCall}
                style={{
                  padding: '14px 36px',
                  fontSize: '14px',
                  fontWeight: 700,
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff',
                }}
              >
                ⏹️ End Call & Review Notes
              </button>
            )}
          </div>

          {/* Live Spoken Transcript Stream (if any messages during call) */}
          {messages.length > 1 && (
            <div className="cube-transcript-stream">
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '4px',
                  marginBottom: '4px',
                }}
              >
                LIVE VOICE TRANSCRIPT:
              </div>
              {messages.slice(-4).map((m, idx) => (
                <div key={idx} style={{ fontSize: '12px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: m.sender === 'user' ? '#a1a1aa' : '#38bdf8',
                      fontWeight: 700,
                      marginRight: '8px',
                    }}
                  >
                    {m.sender === 'user' ? 'YOU:' : 'CUBE:'}
                  </span>
                  <span style={{ color: '#f4f4f5' }}>{m.text}</span>
                </div>
              ))}
              <div ref={liveTranscriptEndRef} />
            </div>
          )}

          {/* Socratic Feynman Guidance Prompts */}
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '10px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                padding: '10px 12px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '2px' }}>
                1. No Buzzwords
              </div>
              If a 12-year-old wouldn't understand the word, don't use it.
            </div>
            <div
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                padding: '10px 12px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '2px' }}>
                2. Explain Mechanics
              </div>
              Walk through the actual step-by-step mechanism.
            </div>
            <div
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                padding: '10px 12px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '2px' }}>
                3. Anticipate Edge Cases
              </div>
              Explain what happens when limits are pushed.
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: Interactive Text Chat Thread Fallback */
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
                  <span>{m.sender === 'user' ? 'YOU' : 'CUBE (AI)'}</span>
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
                Cube is thinking...
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
      )}
    </div>
  );
};
