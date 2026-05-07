import Head from "next/head";
import styles from "@/styles/Home.module.css";

export default function Home() {
  return (
    <>
      <Head>
        <title>AMC Care</title>
        <meta name="description" content="AMC Care — Healthcare platform coming soon" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.badge}>Healthcare Platform</div>
          <h1 className={styles.title}>AMC Care</h1>
          <p className={styles.subtitle}>
            We&apos;re building something great. A modern healthcare experience
            is on its way.
          </p>
          <div className={styles.divider} />
          <p className={styles.notify}>Coming Soon</p>
        </main>
      </div>
    </>
  );
}
