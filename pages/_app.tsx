import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Inter } from "next/font/google";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font" });

function PageLoader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [width, setWidth]     = useState(0);
  const timer                 = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function start() {
      setLoading(true);
      setWidth(0);
      // Animate to ~85% while waiting
      let w = 0;
      timer.current = setInterval(() => {
        w = w < 70 ? w + 8 : w < 85 ? w + 1 : w;
        setWidth(w);
      }, 80);
    }

    function done() {
      if (timer.current) clearInterval(timer.current);
      setWidth(100);
      setTimeout(() => { setLoading(false); setWidth(0); }, 380);
    }

    router.events.on("routeChangeStart",    start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError",    done);
    return () => {
      router.events.off("routeChangeStart",    start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError",    done);
      if (timer.current) clearInterval(timer.current);
    };
  }, [router.events]);

  if (!loading && width === 0) return null;

  return (
    <div style={{
      position:   "fixed",
      top:        0,
      left:       0,
      height:     "2.5px",
      width:      `${width}%`,
      background: "linear-gradient(90deg, #5046e4, #818cf8, #a78bfa)",
      zIndex:     9999,
      transition: width === 100 ? "width 0.2s ease" : "width 0.08s ease",
      boxShadow:  "0 0 8px rgba(80,70,228,0.6)",
      borderRadius: "0 2px 2px 0",
    }} />
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={inter.variable}>
      <PageLoader />
      <Header />
      <Component {...pageProps} />
    </div>
  );
}
