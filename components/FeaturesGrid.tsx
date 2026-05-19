import { Activity, ClipboardList, FlaskConical, HeartPulse, MapPin, Stethoscope, Video } from "lucide-react";
import styles from "./FeaturesGrid.module.css";

const features = [
  { label: "Monitor blood pressure", Icon: HeartPulse,   bg: "#FFEBEE", color: "#E53935", href: "/blood-pressure" },
  { label: "Check your symptoms",    Icon: Stethoscope,  bg: "#FFF3E0", color: "#F57C00", href: "#" },
  { label: "Analyze your labs",      Icon: FlaskConical, bg: "#E8F5E9", color: "#388E3C", href: "/lab-results" },
  { label: "Track your health",      Icon: Activity,     bg: "#FCE4EC", color: "#C2185B", href: "#" },
  { label: "Store medical records",  Icon: ClipboardList,bg: "#E3F2FD", color: "#1565C0", href: "#" },
  { label: "Find hospitals nearby",  Icon: MapPin,       bg: "#F3E5F5", color: "#7B1FA2", href: "#" },
  { label: "Talk to a live doctor",  Icon: Video,        bg: "#E0F7FA", color: "#00838F", href: "#" },
];

export default function FeaturesGrid() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>
        What can <span className={styles.accent}>AMC Care</span> do for you?
      </h2>
      <div className={styles.grid}>
        {features.map((f) => (
          <a key={f.label} href={f.href} className={styles.item}>
            <span className={styles.label}>{f.label}</span>
            <span className={styles.right}>
              <span className={styles.iconWrap} style={{ background: f.bg }}>
                <f.Icon size={18} color={f.color} strokeWidth={2} />
              </span>
              <span className={styles.arrow}>›</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

