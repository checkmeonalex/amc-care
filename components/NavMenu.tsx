import { useEffect } from "react";
import Link from "next/link";
import styles from "./NavMenu.module.css";

function CornerDotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      {[2, 18].map((cx) =>
        [2, 18].map((cy) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.2} fill="#111" />
        ))
      )}
    </svg>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NavMenu({ open, onClose }: Props) {
  // lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* backdrop */}
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ""}`}
        onClick={onClose}
        aria-hidden
      />

      {/* drawer */}
      <div
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* drawer header */}
        <div className={styles.drawerHeader}>
          <span className={styles.menuLabel}>Menu</span>
          <div className={styles.drawerActions}>
            <a href="#" className={styles.loginLink}>Log in</a>
            <a href="#" className={styles.ctaBtn}>Be a member</a>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
              <CornerDotsIcon />
            </button>
          </div>
        </div>

        {/* nav content */}
        <nav className={styles.navContent}>
          <p className={styles.sectionLabel}>Features</p>
          <ul className={styles.primaryLinks}>
            <li>
              <Link href="/coming-soon?feature=symptom-checker">Symptom checker</Link>
              <span className={styles.comingSoonTag}>Coming Soon</span>
            </li>
            <li><Link href="/lab-results">Lab result analysis</Link></li>
            <li><Link href="/blood-pressure">Monitor blood pressure</Link></li>
            <li>
              <Link href="/coming-soon?feature=health-tracking">Health tracking</Link>
              <span className={styles.comingSoonTag}>Coming Soon</span>
            </li>
            <li>
              <Link href="/coming-soon?feature=medical-records">Medical records</Link>
              <span className={styles.comingSoonTag}>Coming Soon</span>
            </li>
            <li>
              <Link href="/coming-soon?feature=find-hospitals">Find hospitals</Link>
              <span className={styles.comingSoonTag}>Coming Soon</span>
            </li>
            <li>
              <Link href="/coming-soon?feature=talk-to-a-doctor">Talk to a doctor</Link>
              <span className={styles.comingSoonTag}>Coming Soon</span>
            </li>
          </ul>

          <div className={styles.secondaryGrid}>
            <div>
              <p className={styles.sectionLabel}>Support</p>
              <ul className={styles.secondaryLinks}>
                <li><Link href="/coming-soon">How it works</Link></li>
                <li><Link href="/coming-soon">FAQs</Link></li>
                <li><Link href="/coming-soon">Reviews</Link></li>
              </ul>
            </div>
            <div>
              <p className={styles.sectionLabel}>Company</p>
              <ul className={styles.secondaryLinks}>
                <li><Link href="/coming-soon">About us</Link></li>
                <li><Link href="/coming-soon">For hospitals</Link></li>
                <li><Link href="/coming-soon">Careers</Link></li>
                <li><Link href="/coming-soon">Contact</Link></li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
