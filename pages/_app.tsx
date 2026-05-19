import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font" });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={inter.variable}>
      <Header />
      <Component {...pageProps} />
    </div>
  );
}
