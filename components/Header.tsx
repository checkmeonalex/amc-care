import { useEffect, useState } from "react";
import styles from "./Header.module.css";
import Logo from "./Logo";
import NavMenu from "./NavMenu";

function GridIcon({ open, dark }: { open: boolean; dark: boolean }) {
  const fill = dark ? "#fff" : "#111";
  const r = 2.2;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      {/* closed: 3×3 grid */}
      {[2, 10, 18].map((cx) =>
        [2, 10, 18].map((cy) => {
          const isCorner = (cx === 2 || cx === 18) && (cy === 2 || cy === 18);
          const tx = open ? (cx < 10 ? -(cx - 2) : 18 - cx) : 0;
          const ty = open ? (cy < 10 ? -(cy - 2) : 18 - cy) : 0;
          const opacity = open && !isCorner ? 0 : 1;
          const scale = open && !isCorner ? 0 : 1;
          return (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={r}
              fill={fill}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                opacity,
                transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
              }}
            />
          );
        })
      )}
    </svg>
  );
}

export default function Header() {
  const [atTop, setAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setAtTop(window.scrollY < 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cls = [
    styles.header,
    !atTop ? styles.scrolled : "",
  ].join(" ");

  return (
    <>
      <header className={cls}>
        <nav className={styles.left}>
          <a href="#">Features</a>
          <a href="#">Reviews</a>
          <a href="#">FAQs</a>
        </nav>

        <div className={styles.brand}><Logo dark={!atTop} /></div>

        <div className={styles.right}>
          <a href="#" className={styles.login}>Log in</a>
          <a href="#" className={styles.cta}>Become a member</a>
          <button
            className={`${styles.grid} ${menuOpen ? styles.gridActive : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <GridIcon open={menuOpen} dark={!atTop} />
          </button>
        </div>
      </header>

      <NavMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
