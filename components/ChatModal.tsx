import { useEffect, useRef, useState } from "react";
import { Mic, Sparkles, X, ArrowUp } from "lucide-react";
import styles from "./ChatModal.module.css";

type Message = { role: "user" | "assistant"; content: string };

const MAX_QUESTIONS = 5;
const RADIUS        = 13;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SUGGESTIONS = [
  "Explain my results",
  "What should I do next?",
  "Is this serious?",
  "Compare to normal",
  "What causes this?",
];

function ringColor(remaining: number): string {
  if (remaining >= 4) return "#34c759";
  if (remaining === 3) return "#ff9500";
  if (remaining === 2) return "#ff6b00";
  return "#ff3b30";
}

function QuestionRing({ asked }: { asked: number }) {
  const remaining = MAX_QUESTIONS - asked;
  const progress  = remaining / MAX_QUESTIONS;
  const offset    = CIRCUMFERENCE * (1 - progress);
  const color     = remaining === 0 ? "#ff3b30" : ringColor(remaining);

  return (
    <div className={styles.ringWrap} title={`${remaining} question${remaining !== 1 ? "s" : ""} remaining`}>
      <svg width="34" height="34" viewBox="0 0 34 34">
        {/* Track */}
        <circle
          cx="17" cy="17" r={RADIUS}
          fill="none"
          stroke="rgba(60,60,67,0.12)"
          strokeWidth="2.8"
        />
        {/* Progress */}
        <circle
          cx="17" cy="17" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 17 17)"
          style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.4s ease" }}
        />
      </svg>
      <span className={styles.ringCount} style={{ color }}>
        {remaining}
      </span>
    </div>
  );
}

const CHAT_VERSION = "v1";

function loadChat(storageKey: string): Message[] {
  try {
    const raw = localStorage.getItem(`amc_chat_${CHAT_VERSION}_${storageKey}`);
    if (!raw) return [];
    return (JSON.parse(raw) as Message[]) ?? [];
  } catch { return []; }
}

function saveChat(storageKey: string, msgs: Message[]) {
  try {
    localStorage.setItem(`amc_chat_${CHAT_VERSION}_${storageKey}`, JSON.stringify(msgs));
  } catch { /* quota */ }
}

type Props = {
  open: boolean;
  onClose: () => void;
  context: string;
  storageKey: string;
};

export default function ChatModal({ open, onClose, context, storageKey }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => loadChat(storageKey));
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  const questionsAsked = messages.filter(m => m.role === "user").length;
  const exhausted      = questionsAsked >= MAX_QUESTIONS;

  // Reload messages when storageKey changes (different file uploaded)
  useEffect(() => {
    setMessages(loadChat(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function persist(msgs: Message[]) {
    setMessages(msgs);
    saveChat(storageKey, msgs);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || exhausted) return;
    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    persist(next);
    setInput("");
    setLoading(true);
    try {
      const res  = await fetch("/api/lab/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: next, context }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      const withReply: Message[] = [...next, {
        role:    "assistant" as const,
        content: data.reply ?? data.error ?? "Sorry, something went wrong.",
      }];
      persist(withReply);
    } catch {
      const withErr: Message[] = [...next, { role: "assistant" as const, content: "Network error — please try again." }];
      persist(withErr);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className={styles.title}>Chat with AI</h2>
          <QuestionRing asked={questionsAsked} />
        </div>

        {/* Body */}
        <div className={styles.body}>
          {messages.length === 0 && !loading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <div className={styles.emptyIconLine} style={{ width: "100%" }} />
                <div className={styles.emptyIconLine} style={{ width: "72%" }} />
                <div className={styles.emptyIconLine} style={{ width: "85%" }} />
              </div>
              <h3 className={styles.emptyTitle}>Ask anything to AI</h3>
              <p className={styles.emptySub}>
                Ask any question about your lab results — explain values, understand what to do next, or compare ranges.
              </p>
              <button className={styles.examplesBtn} onClick={() => send("Give me examples of questions I can ask about my lab results.")}>
                <Sparkles size={13} strokeWidth={2} />
                Examples
              </button>
            </div>
          ) : (
            <>
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className={styles.userBubble}>{m.content}</div>
                ) : (
                  <div key={i} className={styles.aiBubble}>{m.content}</div>
                )
              )}
              {loading && (
                <div className={styles.aiBubble}>
                  <div className={styles.typingDots}>
                    <span /><span /><span />
                  </div>
                </div>
              )}
              {exhausted && !loading && (
                <p className={styles.limitMsg}>
                  You&rsquo;ve used all 5 questions for this result. Upload a new document to continue.
                </p>
              )}
            </>
          )}
          <div ref={bottomRef} style={{ minHeight: 1, flexShrink: 0 }} />
        </div>

        {/* Suggestion chips — hidden when exhausted */}
        {!exhausted && (
          <div className={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <button key={s} className={styles.chip} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className={styles.inputBar}>
          <div className={`${styles.inputWrap} ${exhausted ? styles.inputWrapDisabled : ""}`}>
            <span className={styles.inputIcon}>≈</span>
            <input
              ref={inputRef}
              className={styles.input}
              placeholder={exhausted ? "Question limit reached" : "Ask to AI"}
              value={input}
              disabled={exhausted}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            />
            {input.trim() && !exhausted ? (
              <button className={styles.sendBtn} onClick={() => send(input)} disabled={loading} aria-label="Send">
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            ) : (
              <button className={styles.micBtn} disabled={exhausted} aria-label="Voice input">
                <Mic size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
