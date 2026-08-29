import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "Video Speed Reader — 讓每一段聲音都能被讀懂",
};

export default function HomePage() {
  return <LandingPage />;
}
