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
            <li><a href="#">Symptom checker</a></li>
            <li><Link href="/lab-results">Lab result analysis</Link></li>
            <li><Link href="/blood-pressure">Monitor blood pressure</Link></li>
            <li><a href="#">Health tracking</a></li>
            <li><a href="#">Medical records</a></li>
            <li><a href="#">Find hospitals</a></li>
            <li><a href="#">Talk to a doctor</a></li>
          </ul>

          <div className={styles.secondaryGrid}>
            <div>
              <p className={styles.sectionLabel}>Support</p>
              <ul className={styles.secondaryLinks}>
                <li><a href="#">How it works</a></li>
                <li><a href="#">FAQs</a></li>
                <li><a href="#">Reviews</a></li>
              </ul>
            </div>
            <div>
              <p className={styles.sectionLabel}>Company</p>
              <ul className={styles.secondaryLinks}>
                <li><a href="#">About us</a></li>
                <li><a href="#">For hospitals</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
