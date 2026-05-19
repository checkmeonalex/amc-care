import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import styles from "./Testimonials.module.css";

const testimonials = [
  { quote: "AMC Care helped me understand my lab results for the first time. I finally know what my numbers actually mean.", attr: "Member on understanding their health" },
  { quote: "I described my symptoms and got real guidance instantly. It felt like having a doctor right there with me.", attr: "Member on getting quick answers" },
  { quote: "Finding a nearby hospital used to be so stressful. Now I open AMC Care and everything I need is right there.", attr: "Member on finding care nearby" },
  { quote: "Tracking my blood pressure daily has made me so much more aware of my patterns. The alerts genuinely help.", attr: "Member on health tracking" },
  { quote: "The AI asked the right follow-up questions and helped me realise I needed to see a doctor sooner than I thought.", attr: "Member on symptom checking" },
  { quote: "Having all my family's medical records in one place has been a complete game changer. No more lost paperwork.", attr: "Member on medical records" },
  { quote: "I used to dread going for tests because I never understood the results. AMC Care explains everything in plain language.", attr: "Member on lab result clarity" },
  { quote: "The live doctor feature saved me a 3-hour wait at the clinic. I got the answers I needed from my sofa.", attr: "Member on live doctor consultations" },
  { quote: "My cholesterol was flagged as borderline and AMC Care walked me through exactly what to do next. I felt supported.", attr: "Member on actionable health guidance" },
  { quote: "I log my medications every morning and the reminders keep me consistent. My doctor noticed the improvement.", attr: "Member on medication tracking" },
  { quote: "As a parent, being able to store my children's vaccination records and allergies in one place gives me real peace of mind.", attr: "Member on family health management" },
  { quote: "The symptom checker is surprisingly thorough. It didn't just give me a generic answer — it asked the right questions.", attr: "Member on AI symptom checking" },
  { quote: "I travel a lot and finding trusted hospitals in a new city was always a worry. AMC Care solves that completely.", attr: "Member on finding hospitals abroad" },
  { quote: "Seeing my blood pressure trends over weeks finally motivated me to make real lifestyle changes. The data speaks for itself.", attr: "Member on long-term health trends" },
  { quote: "I uploaded my scan results and within seconds AMC Care highlighted the key values and what they meant. Incredible.", attr: "Member on medical record analysis" },
];

const PAGE_SIZE = 3;
const totalPages = Math.ceil(testimonials.length / PAGE_SIZE);

export default function Testimonials() {
  const [start, setStart]         = useState(0);
  const [mobileIdx, setMobileIdx] = useState(0);
  const [visible, setVisible]     = useState(true);
  const [paused, setPaused]       = useState(false);
  const pausedRef = useRef(false);

  const transition = (fn: () => void) => {
    setVisible(false);
    setTimeout(() => { fn(); setVisible(true); }, 350);
  };

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      transition(() => setStart((s) => (s + PAGE_SIZE) % testimonials.length));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const shown       = [0, 1, 2].map((i) => testimonials[(start + i) % testimonials.length]);
  const currentPage = Math.floor(start / PAGE_SIZE);

  return (
    <section className={styles.section}>

      {/* ── Large organic blobs ── */}

      {/* Top-left: big blue blob */}
      <div className={styles.blobTL}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M160,30 C190,60 200,110 175,145 C150,180 95,195 55,175 C15,155 -5,100 10,60 C25,20 75,-5 115,5 C140,12 135,5 160,30Z" fill="#5b8dee"/>
          <path d="M80 95 Q88 85 96 95" stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none"/>
          <path d="M110 95 Q118 85 126 95" stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none"/>
        </svg>
      </div>

      {/* Bottom-left: orange+yellow layered blob */}
      <div className={styles.blobBL}>
        <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M150,25 C175,55 180,100 158,135 C136,170 88,182 50,162 C12,142 -8,95 8,55 C24,15 70,-5 108,5 C132,12 128,0 150,25Z" fill="#f5c518"/>
          <path d="M140,40 C162,65 168,105 148,136 C128,167 85,178 50,160 C15,142 -2,100 12,65 C26,30 68,12 100,18 C120,24 122,18 140,40Z" fill="#e8602a"/>
          <path d="M72 100 Q80 90 88 100" stroke="#111" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M100 100 Q108 90 116 100" stroke="#111" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M78 112 Q92 120 106 112" stroke="#111" strokeWidth="3" strokeLinecap="round" fill="none"/>
        </svg>
      </div>

      {/* Top-right: green+purple layered blob */}
      <div className={styles.blobTR}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40,25 C10,55 5,110 30,148 C55,186 115,198 155,175 C195,152 210,95 190,55 C170,15 120,-8 82,5 C60,13 65,0 40,25Z" fill="#7b3fa0"/>
          <path d="M55,35 C28,62 22,112 45,148 C68,184 122,194 158,173 C194,152 206,100 188,62 C170,24 124,6 88,16 C68,22 78,10 55,35Z" fill="#2eb870"/>
          <path d="M90 105 Q98 95 106 105" stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none"/>
          <path d="M118 105 Q126 95 134 105" stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none"/>
        </svg>
      </div>

      {/* Bottom-right: pink+green blob */}
      <div className={styles.blobBR}>
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M130,22 C155,48 158,92 136,122 C114,152 68,162 36,144 C4,126 -8,84 8,50 C24,16 68,-2 100,6 C120,12 110,0 130,22Z" fill="#2eb870"/>
          <path d="M120,30 C142,54 146,94 126,122 C106,150 64,158 34,142 C4,126 -6,88 8,56 C22,24 62,8 92,14 C110,20 102,10 120,30Z" fill="#f06292"/>
          <path d="M62 85 Q70 76 78 85" stroke="#111" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M88 85 Q96 76 104 85" stroke="#111" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M68 96 Q83 104 98 96" stroke="#111" strokeWidth="3" strokeLinecap="round" fill="none"/>
        </svg>
      </div>

      {/* ── Solid diamond sparkles ── */}
      <svg className={`${styles.spark} ${styles.sparkA}`} viewBox="0 0 40 40" fill="none">
        <path d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z" fill="#f4a72a"/>
      </svg>
      <svg className={`${styles.spark} ${styles.sparkB}`} viewBox="0 0 24 24" fill="none">
        <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill="#f06292"/>
      </svg>

      <h2 className={styles.heading}>
        Members are living healthier,<br />more informed lives
      </h2>

      {/* ── Desktop 3-up ── */}
      <div className={`${styles.desktopGrid} ${visible ? styles.in : styles.out}`}>
        {shown.map((t, i) => (
          <div key={i} className={styles.card}>
            <p className={styles.quote}>&quot;{t.quote}&quot;</p>
            <p className={styles.attr}>{t.attr}</p>
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.dots}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} className={`${styles.dot} ${currentPage === i ? styles.dotActive : ""}`}
              onClick={() => transition(() => setStart(i * PAGE_SIZE))} aria-label={`Page ${i + 1}`} />
          ))}
        </div>
        <button className={styles.pauseBtn} onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"}>
          {paused ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>

      {/* ── Mobile single card ── */}
      <div className={`${styles.mobileCard} ${visible ? styles.in : styles.out}`}>
        <p className={styles.quote}>&quot;{testimonials[mobileIdx].quote}&quot;</p>
        <p className={styles.attr}>{testimonials[mobileIdx].attr}</p>
      </div>
      <div className={styles.mobileNav}>
        <button className={styles.arrow} onClick={() => transition(() => setMobileIdx((i) => (i - 1 + testimonials.length) % testimonials.length))} aria-label="Previous"><ChevronLeft size={18} /></button>
        <span className={styles.mobileCount}>{mobileIdx + 1} / {testimonials.length}</span>
        <button className={styles.arrow} onClick={() => transition(() => setMobileIdx((i) => (i + 1) % testimonials.length))} aria-label="Next"><ChevronRight size={18} /></button>
      </div>

    </section>
  );
}
