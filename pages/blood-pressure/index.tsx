import Head from "next/head";
import { useRouter } from "next/router";
import { AlertTriangle, AlertCircle, X, ArrowRight, Play, Info } from "lucide-react";
import { useRef, useState } from "react";
import styles from "@/styles/BloodPressure.module.css";

const STEPS = [
  {
    title: "Wrap the cuff on your arm",
    desc: "Place the cuff on your bare upper left arm, about 2–3 cm above the elbow. The tube should face downward toward your inner arm. Make sure it fits snugly — not too tight.",
    videoLabel: "How to wrap the cuff",
  },
  {
    title: "Sit in the correct position",
    desc: "Sit upright with your back fully supported. Rest your arm on a flat surface at heart level, palm facing up. Relax and breathe normally. Wait at least 5 minutes before measuring.",
    videoLabel: "Correct sitting position",
  },
  {
    title: "Take your reading",
    desc: "Press start on your machine and enter the numbers you see on the display below.",
    videoLabel: "Reading the machine",
  },
];

const READING_STATE = [
  {
    title: "Take your reading",
    desc: "Press start on your machine and enter the numbers you see on the display below.",
  },
  {
    title: "First reading logged",
    desc: "Taking a second reading gives you a more accurate picture of your own blood pressure — it's worth the extra minute.",
  },
  {
    title: "Looking good",
    desc: "One more reading and you'll have the most accurate result possible. Your body can vary slightly each time.",
  },
  {
    title: "All readings captured",
    desc: "You now have three readings for the most reliable result. Ready to see your blood pressure analysis?",
  },
];

interface Reading {
  sys: number;
  dia: number;
  pulse?: number;
}

const BP_READINGS_KEY = "bp_readings";
const BP_AI_SUMMARY_KEY = "bp_ai_summary";
const BP_RESULT_MESSAGE_KEY = "bp_result_message";

export default function BloodPressurePage() {
  const [step, setStep] = useState(0);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [pulse, setPulse]         = useState("");
  const [popup, setPopup] = useState<{ type: "error" | "warning"; title: string; message: string } | null>(null);
  const [fieldInfo, setFieldInfo] = useState<"sys" | "dia" | "pulse" | null>(null);

  const FIELD_INFO = {
    sys: { label: "SYS — Systolic", text: "The top (SYS) number is the pressure in your arteries when your heart beats and pushes blood out. It is always the higher of the two numbers on your monitor." },
    dia: { label: "DIA — Diastolic", text: "The bottom (DIA) number is the pressure in your arteries between heartbeats, when your heart is resting. It is always the lower of the two numbers on your monitor." },
    pulse: { label: "Pulse (Heart rate)", text: "Your pulse is how many times your heart beats per minute. Most monitors measure it automatically during the reading. It is optional — you can leave it blank if your device did not show it." },
  };
  const sysRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const current      = STEPS[step];
  const inputsFilled = sys.trim() !== "" && dia.trim() !== "";
  const isLastReading = readings.length === 2;
  const lastReading  = readings[readings.length - 1];

  const ctaLabel  = inputsFilled && !isLastReading && readings.length < 3
    ? "Continue"
    : "Analyze results →";
  const ctaActive = inputsFilled || readings.length >= 3;

  function validateInputs(): boolean {
    const s = Number(sys);
    const d = Number(dia);
    const p = pulse.trim() !== "" ? Number(pulse) : null;

    // Step 1 — range check
    if (s < 50 || s > 300) {
      setPopup({ type: "error", title: "SYS out of range", message: `You entered ${s} mmHg for SYS. A valid systolic reading is between 50 and 300 mmHg. Double-check the top number on your machine display and re-enter it.` });
      return false;
    }
    if (d < 30 || d > 200) {
      setPopup({ type: "error", title: "DIA out of range", message: `You entered ${d} mmHg for DIA. A valid diastolic reading is between 30 and 200 mmHg. Double-check the bottom reading labeled DIA on your machine display and re-enter it.` });
      return false;
    }
    if (p !== null) {
      if (p <= 0) {
        setPopup({ type: "error", title: "Device error — no pulse detected", message: `Your machine returned ${p} bpm, which means it couldn't detect a pulse. Check that the cuff is fitted correctly, keep your arm still, and try again.` });
        return false;
      }
      if (p >= 300) {
        setPopup({ type: "error", title: "Device error — reading impossible", message: `${p} bpm is physiologically impossible. Your machine likely detected movement or interference. Remove the cuff, rest for a moment, and take the reading again.` });
        return false;
      }
      if (p >= 250) {
        setPopup({ type: "error", title: "Critical — pulse dangerously high", message: `${p} bpm is a medical emergency. This may indicate a severe arrhythmia. If you are experiencing chest pain, palpitations, or difficulty breathing, call emergency services immediately.` });
        return false;
      }
      if (p >= 200) {
        setPopup({ type: "error", title: "Extreme tachycardia", message: `${p} bpm is extremely high and requires urgent medical attention. This can occur with certain arrhythmias and is not safe to ignore — please seek care promptly.` });
        return false;
      }
      if (p >= 150) {
        setPopup({ type: "warning", title: "High pulse reading", message: `${p} bpm is very high for a resting measurement. This level of tachycardia may need medical evaluation. Make sure you were seated and still during the reading — if so, contact your doctor.` });
        return false;
      }
      if (p >= 120) {
        setPopup({ type: "warning", title: "Elevated resting pulse", message: `${p} bpm is above the normal resting range. This can result from recent exercise, caffeine, or stress. Sit quietly for 10 minutes and retake the measurement. If consistently high, speak with a doctor.` });
        return false;
      }
      if (p <= 20) {
        setPopup({ type: "error", title: "Critical — pulse dangerously low", message: `${p} bpm is a medical emergency. If you are feeling faint, have chest pain, or are short of breath, call emergency services immediately.` });
        return false;
      }
      if (p <= 30) {
        setPopup({ type: "error", title: "Severe bradycardia detected", message: `${p} bpm is dangerously low. This level requires urgent medical attention — do not wait. Please contact a doctor or emergency services now.` });
        return false;
      }
      if (p <= 40) {
        setPopup({ type: "warning", title: "Very low pulse reading", message: `${p} bpm is unusually low and may indicate bradycardia. If you feel dizzy, weak, or short of breath, seek medical advice. If you are highly trained (e.g. a cyclist or distance runner), this may be normal for you — but confirm with a doctor.` });
        return false;
      }
    }

    // Step 2 — relationship check
    if (s <= d) {
      setPopup({ type: "error", title: "Invalid reading", message: `SYS (${s}) must always be higher than DIA (${d}). These may be entered the wrong way around — check your machine display again.` });
      return false;
    }

    // Step 3 — pulse pressure (soft warning, still allows saving)
    const pp = s - d;
    if (pp < 10) {
      setPopup({ type: "warning", title: "Unusually small gap", message: `SYS ${s} and DIA ${d} are very close together (difference: ${pp} mmHg). This can happen with movement or a loose cuff. You can continue, but consider retaking this reading.` });
      return false;
    }
    if (pp > 150) {
      setPopup({ type: "warning", title: "Wide pulse pressure", message: `The gap between SYS ${s} and DIA ${d} is ${pp} mmHg — unusually wide. This may be worth mentioning to a doctor. You can continue if you feel fine.` });
      return false;
    }

    return true;
  }

  function handleCta() {
    if (readings.length >= 3) {
      sessionStorage.removeItem(BP_AI_SUMMARY_KEY);
      sessionStorage.removeItem(BP_RESULT_MESSAGE_KEY);
      sessionStorage.setItem(BP_READINGS_KEY, JSON.stringify(readings));
      router.push("/blood-pressure/results");
      return;
    }
    if (!inputsFilled) return;
    if (!validateInputs()) return;
    saveReading();
  }

  function saveReading() {
    if (readings.length === 0) {
      sessionStorage.removeItem(BP_READINGS_KEY);
      sessionStorage.removeItem(BP_AI_SUMMARY_KEY);
      sessionStorage.removeItem(BP_RESULT_MESSAGE_KEY);
    }

    setReadings((prev) => [
      ...prev,
      {
        sys:   Number(sys),
        dia:   Number(dia),
        pulse: pulse.trim() !== "" ? Number(pulse) : undefined,
      },
    ]);
    setSys("");
    setDia("");
    setPulse("");
    setPopup(null);
    sysRef.current?.focus();
  }

  return (
    <>
      <Head>
        <title>Blood Pressure — AMC Care</title>
        <meta name="description" content="Track and monitor your blood pressure readings." />
      </Head>

      {/* Validation popup */}
      {popup && (
        <div className={styles.popupOverlay} onClick={() => setPopup(null)}>
          <div
            className={`${styles.popup} ${popup.type === "error" ? styles.popupError : styles.popupWarning}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.popupIcon}>
              {popup.type === "error"
                ? <AlertTriangle size={28} strokeWidth={2} />
                : <AlertCircle size={28} strokeWidth={2} />
              }
            </div>
            <div className={styles.popupBody}>
              <p className={styles.popupTitle}>{popup.title}</p>
              <p className={styles.popupMessage}>{popup.message}</p>
            </div>
            {popup.type === "warning" ? (
              <div className={styles.popupActions}>
                <button className={styles.popupContinue} onClick={saveReading}>
                  Continue anyway
                </button>
                <button className={styles.popupRetry} onClick={() => setPopup(null)}>
                  Retake reading
                </button>
                <button className={styles.popupHelp}>
                  Ask for help
                </button>
              </div>
            ) : (
              <>
                <button className={styles.popupClose} onClick={() => setPopup(null)} aria-label="Dismiss">
                  <X size={18} strokeWidth={2.5} />
                </button>
                <div className={styles.popupActions}>
                  <button className={styles.popupHelp}>
                    Ask for help
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <main className={styles.page}>
        <div className={styles.split}>

          {/* ── LEFT: video + machine display ── */}
          <div className={styles.left}>

            {/* Step progress dots */}
            <div className={styles.stepDots}>
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={[
                    styles.dot,
                    i === step ? styles.dotActive : "",
                    i < step ? styles.dotDone : "",
                  ].join(" ")}
                />
              ))}
            </div>

            {/* Video placeholder */}
            <div className={styles.videoWrap}>
              <div className={styles.videoPlaceholder}>
                <div className={styles.playBtn}>
                  <Play size={18} color="white" fill="white" strokeWidth={0} />
                </div>
                <span className={styles.videoLabel}>{current.videoLabel}</span>
              </div>
            </div>

            {/* BP machine display — step 3 only */}
            {step === 2 && (
              <div className={styles.machineDisplay}>
                <div className={styles.machineReading}>
                  <span className={styles.machineReadingLabel}>SYS</span>
                  <span className={styles.machineReadingValue}>
                    {lastReading ? lastReading.sys : "---"}
                  </span>
                  <span className={styles.machineReadingUnit}>mmHg</span>
                </div>

                <div className={styles.machineDivider} />

                <div className={styles.machineReading}>
                  <span className={styles.machineReadingLabel}>DIA</span>
                  <span className={styles.machineReadingValue}>
                    {lastReading ? lastReading.dia : "---"}
                  </span>
                  <span className={styles.machineReadingUnit}>mmHg</span>
                </div>

                <div className={styles.machineDivider} />

                <div className={styles.machineReading}>
                  <span className={styles.machineReadingLabel}>PULSE</span>
                  <span className={`${styles.machineReadingValue} ${styles.dim}`}>
                    {lastReading?.pulse ?? "--"}
                  </span>
                  <span className={styles.machineReadingUnit}>bpm</span>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: instructions + actions ── */}
          <div className={styles.right}>

            <div className={styles.stepBadge}>
              <span>{step + 1}</span>
              Step {step + 1} of {STEPS.length}
            </div>

            {/* Title + desc: dynamic on step 3 based on reading count */}
            <h1 className={styles.title}>
              {step === 2 ? READING_STATE[Math.min(readings.length, 3)].title : current.title}
            </h1>
            <p className={styles.desc}>
              {step === 2 ? READING_STATE[Math.min(readings.length, 3)].desc : current.desc}
            </p>

            {/* Steps 1 & 2: next step button */}
            {step < 2 && (
              <button className={styles.nextBtn} onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            )}

            {/* Step 3: reading entry */}
            {step === 2 && (
              <div className={styles.inputSection}>

                {/* Only show readings that have actually been added */}
                {readings.length > 0 && (
                  <div className={styles.slots}>
                    {readings.map((r, i) => (
                      <div key={i} className={`${styles.slot} ${styles.slotFilled}`}>
                        <span className={styles.slotNum}>#{i + 1}</span>
                        <div className={styles.slotVals}>
                          <span className={styles.slotVal}>{r.sys} <em>SYS</em></span>
                          <span className={styles.slotVal}>{r.dia} <em>DIA</em></span>
                          {r.pulse !== undefined && (
                            <span className={styles.slotVal}>{r.pulse} <em>bpm</em></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Field info tooltip */}
                {fieldInfo && (
                  <div className={styles.fieldInfoOverlay} onClick={() => setFieldInfo(null)}>
                    <div className={styles.fieldInfoBox} onClick={(e) => e.stopPropagation()}>
                      <p className={styles.fieldInfoTitle}>{FIELD_INFO[fieldInfo].label}</p>
                      <p className={styles.fieldInfoText}>{FIELD_INFO[fieldInfo].text}</p>
                      <button className={styles.fieldInfoClose} onClick={() => setFieldInfo(null)}>Got it</button>
                    </div>
                  </div>
                )}

                {/* Input form — hidden once all 3 readings are in */}
                {readings.length < 3 && (
                  <div className={styles.form}>
                    <div className={styles.formRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          SYS <button type="button" className={styles.infoBtn} onClick={() => setFieldInfo("sys")} aria-label="What is SYS?"><Info size={13} strokeWidth={2.2} /></button>
                        </label>
                        <input
                          ref={sysRef}
                          type="number"
                          placeholder="120"
                          value={sys}
                          onChange={(e) => { if (e.target.value.length <= 3) { setSys(e.target.value); setPopup(null); } }}
                          onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })}
                          min={50}
                          max={300}
                        />
                        <span className={styles.fieldUnit}>mmHg</span>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          DIA <button type="button" className={styles.infoBtn} onClick={() => setFieldInfo("dia")} aria-label="What is DIA?"><Info size={13} strokeWidth={2.2} /></button>
                        </label>
                        <input
                          type="number"
                          placeholder="80"
                          value={dia}
                          onChange={(e) => { if (e.target.value.length <= 3) { setDia(e.target.value); setPopup(null); } }}
                          onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })}
                          min={30}
                          max={200}
                        />
                        <span className={styles.fieldUnit}>mmHg</span>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Pulse <button type="button" className={styles.infoBtn} onClick={() => setFieldInfo("pulse")} aria-label="What is Pulse?"><Info size={13} strokeWidth={2.2} /></button> <span className={styles.opt}>(optional)</span>
                        </label>
                        <input
                          type="number"
                          placeholder="72"
                          value={pulse}
                          onChange={(e) => { if (e.target.value.length <= 3) setPulse(e.target.value); }}
                          onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })}
                          min={30}
                          max={220}
                        />
                        <span className={styles.fieldUnit}>bpm</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* THE one button — always present, label + state change as readings progress */}
                <button
                  className={`${styles.reviewBtn} ${styles.smartCta} ${(isLastReading && inputsFilled) || readings.length >= 3 ? styles.ctaReady : ""}`}
                  disabled={!ctaActive}
                  onClick={handleCta}
                >
                  {ctaLabel}
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
