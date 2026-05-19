import { Mail } from "lucide-react";
import { useState } from "react";
import styles from "./Footer.module.css";

const columns = [
  {
    heading: "AMC Care",
    links: ["Features", "How it works", "Pricing", "Reviews", "FAQs", "For Clinics"],
  },
  {
    heading: "Features",
    links: ["Symptom Checker", "Lab Result Analyzer", "Health Tracking", "Medical Records", "Find Hospitals", "Live Doctors"],
  },
  {
    heading: "About",
    links: ["About us", "Our mission", "Careers", "Press", "Blog", "Sitemap"],
  },
  {
    heading: "Support",
    links: ["Help Centre", "Contact us", "Privacy Policy", "Terms of Service", "Security", "Cookie Policy"],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className={styles.footer}>

      {/* ── Newsletter ── */}
      <div className={styles.newsletter}>
        <div className={styles.newsletterIcon}>
          <Mail size={28} color="#fff" strokeWidth={1.8} />
        </div>
        <div className={styles.newsletterText}>
          <h3>Stay in the loop</h3>
          <p>Be the first to get updates on new features, health tips, and special offers.</p>
          <p className={styles.newsletterDisclaimer}>
            By signing up, you agree to receive emails from AMC Care. You can unsubscribe at any time.
          </p>
        </div>
        <div className={styles.newsletterForm}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.emailInput}
          />
          <button className={styles.subscribeBtn}>Subscribe</button>
        </div>
      </div>

      <hr className={styles.divider} />

      {/* ── Link columns ── */}
      <div className={styles.columns}>
        {columns.map((col) => (
          <div key={col.heading} className={styles.col}>
            <h4 className={styles.colHeading}>{col.heading}</h4>
            <ul className={styles.colLinks}>
              {col.links.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
        ))}

        {/* My Account */}
        <div className={styles.col}>
          <h4 className={styles.colHeading}>My Account</h4>
          <a href="#" className={styles.loginBtn}>Log in</a>
          <a href="#" className={styles.signupLink}>Create account</a>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className={styles.bottom}>
        <div className={styles.bottomLeft}>
          <span>© 2026 AMC Care</span>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Cookie Policy</a>
          <a href="#">Security</a>
        </div>
        <div className={styles.socials}>
          <a href="#" aria-label="Facebook"><SvgFacebook /></a>
          <a href="#" aria-label="Instagram"><SvgInstagram /></a>
          <a href="#" aria-label="LinkedIn"><SvgLinkedIn /></a>
          <a href="#" aria-label="Twitter"><SvgTwitter /></a>
          <a href="#" aria-label="YouTube"><SvgYoutube /></a>
        </div>
      </div>

    </footer>
  );
}

function SvgFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function SvgInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function SvgLinkedIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

function SvgTwitter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function SvgYoutube() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#1a1a1a"/>
    </svg>
  );
}
