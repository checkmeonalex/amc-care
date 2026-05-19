import styles from "./LoggingSection.module.css";

const cards = [
  {
    id: "voice",
    tag: "NATURAL LANGUAGE",
    desc: "Log symptoms, medications and vitals by voice or text — no forms, no hassle.",
    src: "https://cdn.prod.website-files.com/696604acc25b997c8d38dea0%2F697c301d2ad917b88ecde148_media-stack-logging-01-v2_webm.webm",
  },
  {
    id: "scan",
    tag: "SCAN",
    desc: "Photograph your lab results or prescriptions to log them instantly.",
    src: "https://cdn.prod.website-files.com/696604acc25b997c8d38dea0%2F697c3109db3b0f87e97d035f_media-stack-logging-02-v2_webm.webm",
  },
  {
    id: "connect",
    tag: "CONNECT",
    desc: "Sync with health apps, wearables and hospital portals automatically.",
    src: "https://cdn.prod.website-files.com/696604acc25b997c8d38dea0%2F697cd5c52a73e7c717cec483_media-stack-logging-03-v4_webm.webm",
  },
];

export default function LoggingSection() {
  return (
    <section className={styles.section}>
      <div className={styles.text}>
        <h2 className={styles.heading}>Effortless health logging for everyone</h2>
        <p className={styles.sub}>
          Use voice, text, photos, or connect to devices and medical portals to instantly
          record your health data — from lab results and medications to vitals and symptoms.
        </p>
      </div>

      <div className={styles.grid}>
        {cards.map((c) => (
          <div key={c.id} className={styles.card}>
            <div className={styles.videoWrap}>
              <video
                className={styles.video}
                src={c.src}
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
            <p className={styles.tag}>{c.tag}</p>
            <p className={styles.desc}>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
