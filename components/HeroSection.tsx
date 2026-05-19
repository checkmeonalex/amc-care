import { useEffect, useState } from "react";
import { CheckCircle, SendHorizonal } from "lucide-react";
import styles from "./HeroSection.module.css";

const rotating = [
  "Know your labs,",
  "Track your vitals,",
  "Find care nearby,",
  "Talk to a doctor,",
  "Understand your body,",
];

export default function HeroSection() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % rotating.length);
        setVisible(true);
      }, 350);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className={styles.page}>
      {/* ── Headline ── */}
      <section className={styles.hero}>
        <h1 className={styles.headline}>
          <span className={`${styles.rotating} ${visible ? styles.in : styles.out}`}>
            {rotating[index]}
          </span>
          <br />
          all with AMC Care
        </h1>

        <div className={styles.badges}>
          <span><CheckCircle size={18} strokeWidth={2} color="#1565c0" style={{ flexShrink: 0 }} />AI symptom checker &amp; smart follow-ups</span>
          <span><CheckCircle size={18} strokeWidth={2} color="#1565c0" style={{ flexShrink: 0 }} />Lab result analysis &amp; health tracking</span>
          <span><CheckCircle size={18} strokeWidth={2} color="#1565c0" style={{ flexShrink: 0 }} />Live doctors &amp; hospitals near you</span>
        </div>
      </section>

      {/* ── Cards ── */}
      <section className={styles.cards}>
        {/* Left card */}
        <div className={`${styles.card} ${styles.cardLeft}`}>
          <h2 className={styles.cardTitle}>
            Your complete health assistant with expert medical tools
          </h2>
          <a href="#" className={styles.btn}>Get started free</a>

          {/* Placeholder mockup */}
          <div className={styles.mockupWrap}>
            <div className={styles.mockupPhone}>
              <div className={styles.mockupInner}>
                <p className={styles.mockupTag}>Lab Results</p>
                <p className={styles.mockupBig}>All looks good</p>
                {[
                  { label: "Hemoglobin A1c", pct: 68 },
                  { label: "Cholesterol",    pct: 45 },
                  { label: "Vitamin D",      pct: 80 },
                ].map((r) => (
                  <div key={r.label} className={styles.resultRow}>
                    <span className={styles.resultLabel}>{r.label}</span>
                    <div className={styles.bar}>
                      <div className={styles.barFill} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.mockupFloat}>
              <span>🩺</span> BP tracked today
            </div>
          </div>
        </div>

        {/* Right card */}
        <div className={`${styles.card} ${styles.cardRight}`}>
          <h2 className={styles.cardTitle}>
            Chat with our medical AI, get guided to the right care
          </h2>
          <a href="#" className={styles.btn}>Start a conversation</a>

          <div className={styles.chatWrap}>
            <div className={`${styles.bubble} ${styles.ai}`}>
              Hi! What symptoms are you experiencing?
            </div>
            <div className={`${styles.bubble} ${styles.user}`}>
              Headache and mild fever since yesterday
            </div>
            <div className={`${styles.bubble} ${styles.ai}`}>
              Got it. Any other symptoms like sore throat or body aches?
            </div>
            {/* User typing */}
            <div className={`${styles.typingWrap} ${styles.typingUser}`}>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
            <div className={styles.inputRow}>
              <input className={styles.input} placeholder="Describe your symptoms…" readOnly />
              <button className={styles.send}>
                <SendHorizonal size={16} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

