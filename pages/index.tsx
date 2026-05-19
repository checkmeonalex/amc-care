import Head from "next/head";
import HeroSection from "@/components/HeroSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import LoggingSection from "@/components/LoggingSection";
import Testimonials from "@/components/Testimonials";
import CtaBanner from "@/components/CtaBanner";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Head>
        <title>AMC Care — Your Personal Health Companion</title>
        <meta name="description" content="AI symptom checker, lab result analysis, health tracking, live doctors and nearby hospitals — all in one place." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HeroSection />
      <FeaturesGrid />
      <LoggingSection />
      <Testimonials />
      <CtaBanner />
      <FAQ />
      <Footer />
</>
  );
}
