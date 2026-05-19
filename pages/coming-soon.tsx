import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Bell } from "lucide-react";
import styles from "@/styles/ComingSoon.module.css";

const FEATURE_LABELS: Record<string, { title: string; desc: string; emoji: string }> = {
  "symptom-checker":   { title: "Symptom Checker",     emoji: "🩺", desc: "Describe how you feel and our AI will help identify possible causes and next steps." },
  "health-tracking":   { title: "Health Tracking",     emoji: "📈", desc: "Log and visualise your vitals, sleep, activity, and more — all in one place." },
  "medical-records":   { title: "Medical Records",     emoji: "📋", desc: "Store and share your full medical history securely with any doctor, anywhere." },
  "find-hospitals":    { title: "Find Hospitals",      emoji: "🏥", desc: "Locate nearby hospitals, clinics, and pharmacies with real-time availability." },
  "talk-to-a-doctor":  { title: "Talk to a Doctor",    emoji: "💬", desc: "Connect with a licensed doctor via chat or video in minutes — no appointment needed." },
  "blood-pressure":    { title: "Blood Pressure Monitor", emoji: "❤️", desc: "Track and analyse your blood pressure readings over time with smart insights." },
};

export default function ComingSoon() {
  const { query } = useRouter();
  const key     = (query.feature as string) ?? "";
  const feature = FEATURE_LABELS[key] ?? { title: "This Feature", emoji: "✨", desc: "We're working hard to bring this to you. Stay tuned for updates." };

  return (
    <>
      <Head>
        <title>{feature.title} — Coming Soon · AMC Care</title>
      </Head>

      <main className={styles.page}>
        <div className={styles.card}>
          <span className={styles.emoji}>{feature.emoji}</span>

          <div className={styles.badge}>Coming Soon</div>

          <h1 className={styles.title}>{feature.title}</h1>
          <p className={styles.desc}>{feature.desc}</p>

          <div className={styles.notify}>
            <Bell size={15} strokeWidth={2} />
            <span>We&rsquo;ll let you know when it&rsquo;s ready</span>
          </div>

          <Link href="/" className={styles.back}>
            <ArrowLeft size={15} strokeWidth={2.5} />
            Back to home
          </Link>
        </div>

        {/* Soft background blobs */}
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </main>
    </>
  );
}
