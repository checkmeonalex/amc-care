import styles from "./HowItWorks.module.css";

const steps = [
  {
    num: "1",
    title: "Describe your symptoms",
    bg: "#e8f0fe",
    content: (
      <div className={styles.chatMock}>
        <div className={styles.chatBubbleAi}>Hi! What brings you in today?</div>
        <div className={styles.chatBubbleUser}>I&apos;ve had a headache &amp; fever since yesterday</div>
        <div className={styles.chatBubbleAi}>Any sore throat or body aches?</div>
        <div className={styles.chatTyping}><span /><span /><span /></div>
      </div>
    ),
  },
  {
    num: "2",
    title: "Understand your lab results",
    bg: "#e8f5e9",
    content: (
      <div className={styles.labMock}>
        <p className={styles.labTitle}>Your Results</p>
        <p className={styles.labSub}>3 values need attention</p>
        {[
          { name: "Vitamin D", val: "Low", color: "#ef5350" },
          { name: "Cholesterol", val: "Normal", color: "#43a047" },
          { name: "Blood Sugar", val: "Borderline", color: "#fb8c00" },
        ].map((r) => (
          <div key={r.name} className={styles.labRow}>
            <span className={styles.labName}>{r.name}</span>
            <span className={styles.labBadge} style={{ color: r.color, background: r.color + "18" }}>{r.val}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "3",
    title: "Track your vitals over time",
    bg: "#fce4ec",
    content: (
      <div className={styles.chartMock}>
        <p className={styles.labTitle}>Blood Pressure</p>
        <p className={styles.labSub}>Last 7 days</p>
        <svg width="100%" height="72" viewBox="0 0 200 72" fill="none">
          <polyline
            points="0,55 33,40 66,48 99,30 132,38 165,22 200,28"
            stroke="#e91e63"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <polyline
            points="0,55 33,40 66,48 99,30 132,38 165,22 200,28"
            stroke="#e91e63"
            strokeWidth="0"
            fill="url(#bpGrad)"
            opacity="0.15"
          />
          <defs>
            <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e91e63" />
              <stop offset="100%" stopColor="#e91e63" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 33, 66, 99, 132, 165, 200].map((x, i) => {
            const ys = [55, 40, 48, 30, 38, 22, 28];
            return <circle key={i} cx={x} cy={ys[i]} r="3.5" fill="#e91e63" />;
          })}
        </svg>
        <div className={styles.chartAlert}>⚠ Elevated on 2 days — consult a doctor</div>
      </div>
    ),
  },
  {
    num: "4",
    title: "Find hospitals &amp; live doctors",
    bg: "#fff3e0",
    content: (
      <div className={styles.mapMock}>
        <div className={styles.mapPin}>📍 General Hospital — 0.8 km</div>
        <div className={styles.mapPin}>📍 City Medical Centre — 1.4 km</div>
        <div className={styles.mapPin}>📍 Apollo Clinic — 2.1 km</div>
        <div className={styles.mapDivider} />
        <div className={styles.doctorRow}>
          <div className={styles.doctorAvatar}>👨‍⚕️</div>
          <div>
            <p className={styles.doctorName}>Dr. Amina Yusuf</p>
            <p className={styles.doctorStatus}>🟢 Available now</p>
          </div>
          <a href="#" className={styles.doctorBtn}>Chat</a>
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>How it works</h2>
      <div className={styles.grid}>
        {steps.map((s) => (
          <div key={s.num} className={styles.card}>
            <span className={styles.num}>{s.num}</span>
            <div className={styles.visual} style={{ background: s.bg }}>
              {s.content}
            </div>
            <p className={styles.title} dangerouslySetInnerHTML={{ __html: s.title }} />
          </div>
        ))}
      </div>
    </section>
  );
}
