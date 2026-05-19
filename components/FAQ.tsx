"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import styles from "./FAQ.module.css";

const faqs = [
  {
    q: "What is AMC Care?",
    a: "AMC Care is a personal health platform that helps you understand your health through AI-powered symptom checking, lab result analysis, blood pressure tracking, medical record storage, and access to nearby hospitals and live doctors — all in one place.",
  },
  {
    q: "How does the AI symptom checker work?",
    a: "You describe your symptoms in plain language and our AI asks smart follow-up questions to better understand your situation. It then provides safe, evidence-based guidance and, where necessary, recommends you see a healthcare professional.",
  },
  {
    q: "Can AMC Care analyze my lab results?",
    a: "Yes. You can upload a photo of your lab report or enter values manually. Our AI explains each result in simple language, highlights anything that needs attention, and tells you what steps to consider next.",
  },
  {
    q: "Is my health data private and secure?",
    a: "Absolutely. Your data is encrypted end-to-end and never sold to third parties. You have full control over what you store and can delete your records at any time.",
  },
  {
    q: "Can I find hospitals near me?",
    a: "Yes. AMC Care uses your location to show you verified hospitals, clinics, and pharmacies nearby — with distance, contact details, and directions.",
  },
  {
    q: "Can I talk to a real doctor on AMC Care?",
    a: "Yes. Our platform connects you with licensed doctors for live chat or video consultations. They can review your symptoms, answer questions, and guide you before or instead of an in-person visit.",
  },
  {
    q: "What can I store in my medical records?",
    a: "You can store allergies, blood group, ongoing medications, medical conditions, vaccination records, past diagnoses, and any documents or lab results you upload.",
  },
  {
    q: "Is AMC Care free to use?",
    a: "Core features like symptom checking, lab result uploads, and health tracking are free. Premium features such as live doctor consultations and unlimited record storage are available on our paid plan.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Frequently asked questions</h2>
      <div className={styles.list}>
        {faqs.map((f, i) => (
          <div key={i} className={styles.item}>
            <button
              className={styles.question}
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span>{f.q}</span>
              {open === i ? <Minus size={18} /> : <Plus size={18} />}
            </button>
            {open === i && (
              <p className={styles.answer}>{f.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
