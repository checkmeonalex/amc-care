import styles from "./CtaBanner.module.css";

const avatars = [
  { initials: "AK", bg: "#f4a72a", pos: styles.av1 },
  { initials: "TM", bg: "#e8602a", pos: styles.av2 },
  { initials: "SL", bg: "#5b8dee", pos: styles.av3 },
  { initials: "NJ", bg: "#2eb870", pos: styles.av4 },
];

const stats = [
  { value: "4.9★", label: "User Rating" },
  { value: "50K+", label: "Active Members" },
  { value: "1M+",  label: "Health Queries Answered" },
  { value: "24/7", label: "AI Support Available" },
];

export default function CtaBanner() {
  return (
    <div className={styles.wrap}>
      <section className={styles.banner}>

        {/* Member badge */}
        <div className={styles.badge}>
          <div className={styles.badgeAvatars}>
            {[
              { bg: "#f4a72a" }, { bg: "#f06292" }, { bg: "#5b8dee" },
            ].map((a, i) => (
              <span key={i} className={styles.badgeDot} style={{ background: a.bg }} />
            ))}
          </div>
          <span>12.4k members this month</span>
        </div>

        {/* Floating avatars */}
        {avatars.map((a) => (
          <div key={a.initials} className={`${styles.avatar} ${a.pos}`} style={{ background: a.bg }}>
            {a.initials}
          </div>
        ))}

        {/* Main content */}
        <h2 className={styles.heading}>
          Join thousands who manage<br />their health with AMC Care
        </h2>
        <a href="#" className={styles.btn}>Get started free</a>

        {/* Stats row */}
        <div className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

      </section>
    </div>
  );
}
